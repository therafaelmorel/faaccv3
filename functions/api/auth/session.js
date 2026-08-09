import { clearSessionCookie, cookieValue, currentUser, json, publicUser, sha256 } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await currentUser(request, env);
  return user ? json({ user: publicUser(user) }) : json({ user: null }, 401);
}

export async function onRequestDelete({ request, env }) {
  const token = cookieValue(request, 'fact_session');
  if (env.DB && token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ success: true }, 200, { 'set-cookie': clearSessionCookie() });
}
