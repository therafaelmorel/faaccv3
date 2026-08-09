const encoder = new TextEncoder();

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

export function cookieValue(request, name) {
  const cookies = request.headers.get('cookie') || '';
  for (const item of cookies.split(';')) {
    const [key, ...parts] = item.trim().split('=');
    if (key === name) return decodeURIComponent(parts.join('='));
  }
  return '';
}

export function sessionCookie(token, maxAge = 43200) {
  return `fact_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return 'fact_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export async function currentUser(request, env) {
  if (!env.DB) return null;
  const token = cookieValue(request, 'fact_session');
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  return env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.can_preview_roles AS canPreviewRoles
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'
  `).bind(tokenHash, now).first();
}

export async function requireUser(request, env) {
  const user = await currentUser(request, env);
  return user || null;
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    canPreviewRoles: Boolean(user.canPreviewRoles)
  };
}
