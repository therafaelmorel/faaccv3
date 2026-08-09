function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function namespace(env) {
  return env.FACT_COMMENTS || env.COMMENTS || null;
}

export async function onRequestGet({ request, env }) {
  const store = namespace(env);
  if (!store) return json({ error: 'Comment storage is not configured.' }, 503);

  const page = new URL(request.url).searchParams.get('page');
  if (!page || page.length > 180) return json({ error: 'A valid page is required.' }, 400);

  const comments = (await store.get(`page:${page}`, { type: 'json' })) || [];
  return json({ comments: Array.isArray(comments) ? comments : [] });
}

export async function onRequestPost({ request, env }) {
  const store = namespace(env);
  if (!store) return json({ error: 'Comment storage is not configured.' }, 503);

  let input;
  try {
    input = await request.json();
  } catch (error) {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const pageKey = typeof input.pageKey === 'string' ? input.pageKey.slice(0, 180) : '';
  const content = typeof input.content === 'string' ? input.content.trim().slice(0, 1200) : '';
  const author = typeof input.author === 'string' ? input.author.trim().slice(0, 80) : 'Reviewer';

  if (!pageKey || !content) return json({ error: 'Page and comment text are required.' }, 400);

  const key = `page:${pageKey}`;
  const existing = (await store.get(key, { type: 'json' })) || [];
  const comment = {
    id: typeof input.id === 'string' ? input.id.slice(0, 80) : crypto.randomUUID(),
    pageKey,
    pageLabel: typeof input.pageLabel === 'string' ? input.pageLabel.slice(0, 160) : 'Current Page',
    author,
    content,
    createdAt: new Date().toISOString()
  };
  const comments = [...(Array.isArray(existing) ? existing : []), comment].slice(-100);

  await store.put(key, JSON.stringify(comments));
  return json({ comment }, 201);
}
