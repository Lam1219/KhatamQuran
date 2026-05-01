export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // GET /api/sync?version=X
  if (path === '/api/sync' && request.method === 'GET') {
    const clientVersion = parseInt(url.searchParams.get('version') || '0');
    const res = await env.DB.prepare('SELECT data, version FROM khatam_state LIMIT 1').first();
    if (!res) return Response.json({  null, version: 0, adminPin: env.ADMIN_PIN });
    if (res.version <= clientVersion) return new Response(null, { status: 304 });
    return Response.json({  JSON.parse(res.data), version: res.version, adminPin: env.ADMIN_PIN });
  }

  // POST /api/sync
  if (path === '/api/sync' && request.method === 'POST') {
    const { data, version } = await request.json();
    if (!data) return new Response('Invalid payload', { status: 400 });

    const current = await env.DB.prepare('SELECT version FROM khatam_state LIMIT 1').first();
    const currentVersion = current?.version || 0;

    if (version < currentVersion) {
      return Response.json({  JSON.parse(current.data), version: currentVersion, conflict: true }, { status: 409 });
    }

    const newVersion = currentVersion + 1;
    await env.DB.prepare(`
      INSERT OR REPLACE INTO khatam_state (id, data, version, updated_at) 
      VALUES (1, ?, ?, ?)
    `).bind(JSON.stringify(data), newVersion, Date.now()).run();

    return Response.json({ data, version: newVersion });
  }

  return new Response('Not Found', { status: 404 });
}