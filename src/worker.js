import { onRequestPost as createInvite } from '../functions/api/admin/invites.js';
import { onRequestPost as login } from '../functions/api/auth/login.js';
import { onRequestPost as recoverAccess } from '../functions/api/auth/recover.js';
import { onRequestDelete as logout, onRequestGet as session } from '../functions/api/auth/session.js';
import { onRequestGet as getComments, onRequestPost as addComment } from '../functions/api/comments.js';
import { onRequestGet as getConfig } from '../functions/api/config.js';
import { json } from '../functions/_lib/auth.js';

const routes = new Map([
  ['GET /api/config', getConfig],
  ['POST /api/auth/login', login],
  ['POST /api/auth/recover', recoverAccess],
  ['GET /api/auth/session', session],
  ['DELETE /api/auth/session', logout],
  ['GET /api/comments', getComments],
  ['POST /api/comments', addComment],
  ['POST /api/admin/invites', createInvite]
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const handler = routes.get(`${request.method.toUpperCase()} ${url.pathname}`);

    if (handler) {
      try {
        return await handler({ request, env });
      } catch (error) {
        console.error('FACT API request failed', error);
        return json({ error: 'The request could not be completed.' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'API route not found.' }, 404);
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const headers = new Headers(response.headers);
      headers.set('cache-control', 'no-store, max-age=0');
      headers.set('cdn-cache-control', 'no-store');
      headers.set('cloudflare-cdn-cache-control', 'no-store');
      headers.set('x-fact-build', 'task-kpi-36');

      return new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  }
};
