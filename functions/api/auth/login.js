import { json, publicUser, sessionCookie, sha256 } from '../../_lib/auth.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 254);
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The prototype database is not configured.' }, 503);

  let input;
  try {
    input = await request.json();
  } catch (error) {
    return json({ error: 'Invalid sign-in request.' }, 400);
  }

  const email = normalizeEmail(input.email);
  const accessCode = String(input.accessCode || '').trim();
  if (!email || !accessCode) return json({ error: 'Email and access code are required.' }, 400);
  if (!email.includes('@')) return json({ error: 'Enter a valid email address.' }, 400);

  const now = new Date().toISOString();
  const accessCodeHash = await sha256(accessCode);
  const configuredBootstrapAdmin = env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_CODE &&
    email === normalizeEmail(env.BOOTSTRAP_ADMIN_EMAIL) && accessCode === env.BOOTSTRAP_ADMIN_CODE;
  const existingUserCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
  const databaseIsEmpty = Number(existingUserCount?.count || 0) === 0;
  const oneTimeBootstrapAdmin = databaseIsEmpty && env.BOOTSTRAP_ADMIN_SETUP_HASH &&
    accessCodeHash === env.BOOTSTRAP_ADMIN_SETUP_HASH;

  if (configuredBootstrapAdmin || oneTimeBootstrapAdmin) {
    await env.DB.prepare(`
      INSERT INTO users (id, email, name, role, access_code_hash, can_preview_roles, status, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', ?, 1, 'active', ?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = 'admin', access_code_hash = excluded.access_code_hash,
        can_preview_roles = 1, status = 'active', updated_at = excluded.updated_at
    `).bind(crypto.randomUUID(), email, env.BOOTSTRAP_ADMIN_NAME || 'Rafael Morel', accessCodeHash, now, now).run();
  }

  const user = await env.DB.prepare(`
    SELECT id, email, name, role, access_code_hash AS accessCodeHash, can_preview_roles AS canPreviewRoles
    FROM users WHERE email = ? AND status = 'active'
  `).bind(email).first();

  if (!user || accessCodeHash !== user.accessCodeHash) {
    return json({ error: 'The email or access code is incorrect.' }, 401);
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(tokenHash, user.id, expires, now)
  ]);

  return json({ user: publicUser(user) }, 200, { 'set-cookie': sessionCookie(token) });
}
