import { json, requireUser, sha256 } from '../../_lib/auth.js';

const allowedRoles = new Set(['admin', 'team', 'leadership']);

function makeAccessCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const value = [...bytes].map(byte => (byte % 36).toString(36)).join('').toUpperCase();
  return `FACT-${value.slice(0, 3)}-${value.slice(3)}`;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The prototype database is not configured.' }, 503);
  if (env.BUILD_MODE === 'false') return json({ error: 'Tester invitations are disabled in production.' }, 404);

  const admin = await requireUser(request, env);
  if (!admin || admin.role !== 'admin') return json({ error: 'Administrator access is required.' }, 403);

  let input;
  try {
    input = await request.json();
  } catch (error) {
    return json({ error: 'Invalid invitation request.' }, 400);
  }

  const email = String(input.email || '').trim().toLowerCase().slice(0, 254);
  const name = String(input.name || '').trim().slice(0, 100);
  const role = String(input.role || 'team');
  if (!email || !name || !allowedRoles.has(role)) return json({ error: 'Name, email and a valid role are required.' }, 400);

  const accessCode = makeAccessCode();
  const codeHash = await sha256(accessCode);
  const now = new Date().toISOString();
  const canPreview = role === 'admin' && input.canPreviewRoles !== false ? 1 : 0;
  await env.DB.prepare(`
    INSERT INTO users (id, email, name, role, access_code_hash, can_preview_roles, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role, access_code_hash = excluded.access_code_hash,
      can_preview_roles = excluded.can_preview_roles, status = 'active', updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), email, name, role, codeHash, canPreview, now, now).run();

  return json({ invitation: { email, name, role, accessCode } }, 201);
}
