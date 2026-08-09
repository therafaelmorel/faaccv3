import { onRequestPost as createInvite } from '../functions/api/admin/invites.js';
import { onRequestPost as login } from '../functions/api/auth/login.js';
import { onRequestDelete as logout, onRequestGet as session } from '../functions/api/auth/session.js';
import { onRequestGet as getComments, onRequestPost as addComment } from '../functions/api/comments.js';
import { onRequestGet as getConfig } from '../functions/api/config.js';
import { json } from '../functions/_lib/auth.js';

const routes = new Map([
  ['GET /api/config', getConfig],
  ['POST /api/auth/login', login],
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

    return env.ASSETS.fetch(request);
  }
};
