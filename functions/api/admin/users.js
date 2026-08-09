import { json, requireUser } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'The prototype database is not configured.' }, 503);
  const admin = await requireUser(request, env);
  if (!admin || admin.role !== 'admin') return json({ error: 'Administrator access is required.' }, 403);

  const rows = await env.DB.prepare(`SELECT id, email, name, role, status, created_at AS createdAt
    FROM users ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'team' THEN 1 ELSE 2 END, created_at ASC`).all();
  return json({ users: rows.results || [] });
}
