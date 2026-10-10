const { once } = require('node:events');
const { createApp } = require('../src/app.cjs');
const { createStore } = require('../src/store.cjs');

(async () => {
  const store = createStore();
  const server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(method, path, body) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = response.status === 204 ? null : await response.json();
    console.log(method, path, response.status, data ?? '');
    if (!response.ok) throw new Error('Demo request failed');
    return data;
  }
  try {
    const task = await request('POST', '/api/tasks', { title: 'Trace a request', priority: 'high' });
    await request('GET', '/api/tasks/' + task.id);
    await request('PATCH', '/api/tasks/' + task.id, { status: 'done' });
    await request('DELETE', '/api/tasks/' + task.id);
    const report = await request('POST', '/api/reports', { title: 'Mock phishing report', website: 'https://example.test', fraudType: 'Phishing' });
    await request('PATCH', '/api/reports/' + report.id, { status: 'reviewing' });
    await request('DELETE', '/api/reports/' + report.id);
  } finally {
    await new Promise(resolve => server.close(resolve));
    store.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
