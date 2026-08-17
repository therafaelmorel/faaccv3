import { json, sha256 } from '../../_lib/auth.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 254);
}

function safeEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The prototype database is not configured.' }, 503);
  if (String(env.ADMIN_RECOVERY_ENABLED || '').toLowerCase() !== 'true') {
    return json({ error: 'Temporary account recovery is unavailable.' }, 404);
  }

  let input;
  try {
    input = await request.json();
  } catch (error) {
    return json({ error: 'Invalid recovery request.' }, 400);
  }

  const email = normalizeEmail(input.email);
  const recoveryCode = String(input.recoveryCode || '').trim().slice(0, 128);
  const newAccessCode = String(input.newAccessCode || '').trim().slice(0, 128);
  const allowedEmail = normalizeEmail(env.ADMIN_RECOVERY_EMAIL);
  const configuredHash = String(env.ADMIN_RECOVERY_TOKEN_HASH || '').trim().toLowerCase();

  if (!email || !recoveryCode || !newAccessCode) {
    return json({ error: 'Email, recovery key and new access code are required.' }, 400);
  }
  if (newAccessCode.length < 12) {
    return json({ error: 'Your new access code must be at least 12 characters.' }, 400);
  }

  const recoveryHash = await sha256(recoveryCode);
  if (!allowedEmail || !configuredHash || email !== allowedEmail || !safeEqual(recoveryHash, configuredHash)) {
    return json({ error: 'The recovery details are incorrect or no longer valid.' }, 401);
  }

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS used_recovery_tokens (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      used_at TEXT NOT NULL
    )
  `).run();

  const previouslyUsed = await env.DB.prepare(
    'SELECT token_hash FROM used_recovery_tokens WHERE token_hash = ?'
  ).bind(recoveryHash).first();
  if (previouslyUsed) {
    return json({ error: 'This recovery key has already been used.' }, 409);
  }

  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ? AND role = 'admin' AND status = 'active'"
  ).bind(email).first();
  if (!user) {
    return json({ error: 'The recovery details are incorrect or no longer valid.' }, 401);
  }

  const now = new Date().toISOString();
  const newAccessCodeHash = await sha256(newAccessCode);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET access_code_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newAccessCodeHash, now, user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('INSERT INTO used_recovery_tokens (token_hash, email, used_at) VALUES (?, ?, ?)')
      .bind(recoveryHash, email, now)
  ]);

  return json({ success: true, message: 'Your access code has been reset.' });
}
