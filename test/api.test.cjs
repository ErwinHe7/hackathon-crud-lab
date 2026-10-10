const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app.cjs');
const { createStore } = require('../src/store.cjs');

async function fixture(t, override) {
  const store = createStore();
  const server = createApp(override || store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (method, path, body, raw = false) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
    return { status: response.status, location: response.headers.get('location'), data: response.status === 204 ? null : await response.json() };
  };
}
const samples = {
  tasks: { title: 'Trace a request', priority: 'high' },
  reports: { title: 'Mock phishing', website: 'https://example.test', fraudType: 'Phishing', description: 'Practice only' }
};
for (const kind of ['tasks', 'reports']) {
  test(kind + ': create, read, partial update, filter, delete, and missing ID', async t => {
    const request = await fixture(t);
    const base = '/api/' + kind;
    const created = await request('POST', base, samples[kind]);
    assert.equal(created.status, 201);
    assert.equal(created.location, base + '/' + created.data.id);
    const route = base + '/' + created.data.id;
    assert.equal((await request('GET', route)).data.title, samples[kind].title);
    const newStatus = kind === 'tasks' ? 'done' : 'reviewing';
    const changed = await request('PATCH', route, { status: newStatus });
    assert.equal(changed.data.title, samples[kind].title, 'PATCH preserves unspecified fields');
    assert.equal(changed.data.createdAt, created.data.createdAt);
    assert.equal((await request('GET', base + '?status=' + newStatus)).data.length, 1);
    assert.equal((await request('GET', base + '?q=nonexistent')).data.length, 0);
    assert.equal((await request('DELETE', route)).status, 204);
    assert.equal((await request('GET', route)).status, 404);
    assert.equal((await request('DELETE', route)).status, 404);
    assert.equal((await request('PATCH', route, { status: newStatus })).status, 404);
  });
  test(kind + ': rejected input is never persisted', async t => {
    const request = await fixture(t);
    for (const body of [{}, { ...samples[kind], title: '' }, { ...samples[kind], status: null }, { ...samples[kind], id: 'caller-controlled' }, []]) {
      assert.equal((await request('POST', '/api/' + kind, body)).status, 400);
    }
    assert.equal((await request('GET', '/api/' + kind)).data.length, 0);
  });
}
test('reports reject executable URL schemes and tasks reject numeric titles', async t => {
  const request = await fixture(t);
  assert.equal((await request('POST', '/api/reports', { ...samples.reports, website: 'javascript:alert(1)' })).status, 400);
  assert.equal((await request('POST', '/api/tasks', { title: 123 })).status, 400);
});
test('partial updates reject empty patches and read-only fields', async t => {
  const request = await fixture(t);
  const { data } = await request('POST', '/api/tasks', samples.tasks);
  for (const patch of [{}, { id: 'other' }, { title: '' }, { priority: 'urgent' }]) {
    assert.equal((await request('PATCH', '/api/tasks/' + data.id, patch)).status, 400);
  }
  assert.equal((await request('GET', '/api/tasks/' + data.id)).data.title, samples.tasks.title);
});
test('kinds stay separate even when a caller knows another resource ID', async t => {
  const request = await fixture(t);
  const { data } = await request('POST', '/api/tasks', samples.tasks);
  assert.equal((await request('GET', '/api/reports/' + data.id)).status, 404);
  assert.equal((await request('DELETE', '/api/reports/' + data.id)).status, 404);
  assert.equal((await request('GET', '/api/tasks/' + data.id)).status, 200);
});
test('concurrent creates all persist and receive distinct IDs', async t => {
  const request = await fixture(t);
  const responses = await Promise.all(Array.from({ length: 10 }, (_, i) => request('POST', '/api/tasks', { title: 'Task ' + i })));
  assert.equal(new Set(responses.map(r => r.data.id)).size, 10);
  assert.equal((await request('GET', '/api/tasks')).data.length, 10);
});
test('malformed JSON, bad query parameters, and unknown routes have explicit errors', async t => {
  const request = await fixture(t);
  assert.equal((await request('POST', '/api/tasks', '{', true)).status, 400);
  assert.equal((await request('GET', '/api/tasks?status=invalid')).status, 400);
  assert.equal((await request('GET', '/api/tasks?q=a&q=b')).status, 400);
  assert.equal((await request('GET', '/api/missing')).status, 404);
});
test('storage failure sends 500 without leaking internal details', async t => {
  const request = await fixture(t, { create() { throw new Error('private database detail'); } });
  const response = await request('POST', '/api/tasks', samples.tasks);
  assert.equal(response.status, 500);
  assert.deepEqual(response.data, { error: 'Internal error' });
});
