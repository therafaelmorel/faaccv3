import { json, requireUser } from '../_lib/auth.js';

function namespace(env) {
  return env.FACT_COMMENTS || env.COMMENTS || null;
}

function developmentEnabled(env) {
  return env.BUILD_MODE !== 'false' && env.FEEDBACK_ENABLED !== 'false';
}

export async function onRequestGet({ request, env }) {
  if (!developmentEnabled(env)) return json({ error: 'Development feedback is disabled.' }, 404);

  const page = new URL(request.url).searchParams.get('page');
  if (!page || page.length > 180) return json({ error: 'A valid page is required.' }, 400);

  if (env.DB) {
    const user = await requireUser(request, env);
    if (!user) return json({ error: 'Sign in to view feedback.' }, 401);
    const result = await env.DB.prepare(`
      SELECT id, page_key AS pageKey, page_label AS pageLabel, author_name AS author,
        author_role AS authorRole, content, created_at AS createdAt
      FROM page_comments WHERE page_key = ? ORDER BY created_at ASC LIMIT 100
    `).bind(page).all();
    return json({ comments: result.results || [] });
  }

  const store = namespace(env);
  if (!store) return json({ error: 'Comment storage is not configured.' }, 503);
  const comments = (await store.get(`page:${page}`, { type: 'json' })) || [];
  return json({ comments: Array.isArray(comments) ? comments : [] });
}

export async function onRequestPost({ request, env }) {
  if (!developmentEnabled(env)) return json({ error: 'Development feedback is disabled.' }, 404);

  let input;
  try {
    input = await request.json();
  } catch (error) {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const pageKey = typeof input.pageKey === 'string' ? input.pageKey.slice(0, 180) : '';
  const content = typeof input.content === 'string' ? input.content.trim().slice(0, 1200) : '';
  if (!pageKey || !content) return json({ error: 'Page and comment text are required.' }, 400);

  if (env.DB) {
    const user = await requireUser(request, env);
    if (!user) return json({ error: 'Sign in to add feedback.' }, 401);
    const comment = {
      id: crypto.randomUUID(),
      pageKey,
      pageLabel: typeof input.pageLabel === 'string' ? input.pageLabel.slice(0, 160) : 'Current Page',
      author: user.name,
      authorRole: user.role,
      content,
      createdAt: new Date().toISOString()
    };
    await env.DB.prepare(`
      INSERT INTO page_comments (id, page_key, page_label, user_id, author_name, author_role, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(comment.id, comment.pageKey, comment.pageLabel, user.id, comment.author, comment.authorRole, comment.content, comment.createdAt).run();
    return json({ comment }, 201);
  }

  const store = namespace(env);
  if (!store) return json({ error: 'Comment storage is not configured.' }, 503);
  const key = `page:${pageKey}`;
  const existing = (await store.get(key, { type: 'json' })) || [];
  const comment = {
    id: typeof input.id === 'string' ? input.id.slice(0, 80) : crypto.randomUUID(),
    pageKey,
    pageLabel: typeof input.pageLabel === 'string' ? input.pageLabel.slice(0, 160) : 'Current Page',
    author: typeof input.author === 'string' ? input.author.trim().slice(0, 80) : 'Reviewer',
    authorRole: typeof input.authorRole === 'string' ? input.authorRole.slice(0, 30) : 'tester',
    content,
    createdAt: new Date().toISOString()
  };
  const comments = [...(Array.isArray(existing) ? existing : []), comment].slice(-100);
  await store.put(key, JSON.stringify(comments));
  return json({ comment }, 201);
}
