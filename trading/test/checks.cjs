const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createStore } = require('../../src/store.cjs');

function registerChecks(makeApp) {
  async function withApp(run, changeStore = () => {}) {
    const store = createStore(':memory:');
    changeStore(store);
    const server = makeApp(store).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port;
    const request = async (method, route = '/api/watchlist', body) => {
      const response = await fetch(base + route, {
        method,
        ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
    };
    try { await run(request, base); }
    finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      store.close();
    }
  }

  test('create returns 201, Location, generated identity, defaults, and a readable saved record', async () => withApp(async request => {
    const created = await request('POST', '/api/watchlist', { symbol: ' aapl ' });
    assert.equal(created.status, 201);
    assert.equal(created.body.symbol, 'AAPL');
    assert.equal(created.body.notes, '');
    assert.equal(created.body.targetPriceCents, null);
    assert.match(created.body.id, /^[0-9a-f-]{36}$/);
    assert.ok(Number.isFinite(Date.parse(created.body.createdAt)));
    assert.equal(created.headers.get('location'), '/api/watchlist/' + created.body.id);
    const read = await request('GET', created.headers.get('location'));
    assert.equal(read.status, 200);
    assert.deepEqual(read.body, created.body);
  }));

  test('list starts empty and keeps all entries after separate requests', async () => withApp(async request => {
    const empty = await request('GET');
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body, []);
    for (const symbol of ['MSFT', 'BRK.B']) assert.equal((await request('POST', '/api/watchlist', { symbol })).status, 201);
    const listed = await request('GET');
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.body.map(record => record.symbol), ['MSFT', 'BRK.B']);
  }));

  test('duplicate normalized symbols return 409 and do not create extra entries', async () => withApp(async request => {
    assert.equal((await request('POST', '/api/watchlist', { symbol: 'NVDA' })).status, 201);
    assert.equal((await request('POST', '/api/watchlist', { symbol: ' nvda ' })).status, 409);
    assert.equal((await request('GET')).body.length, 1);
  }));

  test('PATCH preserves omitted fields, id, and createdAt', async () => withApp(async request => {
    const created = await request('POST', '/api/watchlist', { symbol: 'TSLA', targetPriceCents: 22000, notes: 'Study the response' });
    assert.equal(created.status, 201);
    const route = '/api/watchlist/' + created.body.id;
    const updated = await request('PATCH', route, { notes: 'Changed note' });
    assert.equal(updated.status, 200);
    assert.deepEqual(updated.body, { ...created.body, notes: 'Changed note' });
    const read = await request('GET', route);
    assert.deepEqual(read.body, updated.body);
    const cleared = await request('PATCH', route, { targetPriceCents: null });
    assert.equal(cleared.status, 200);
    assert.deepEqual(cleared.body, { ...updated.body, targetPriceCents: null });
  }));

  test('PATCH allows an unchanged symbol but rejects another saved symbol', async () => withApp(async request => {
    const first = await request('POST', '/api/watchlist', { symbol: 'AAPL' });
    assert.equal(first.status, 201);
    const second = await request('POST', '/api/watchlist', { symbol: 'MSFT' });
    assert.equal(second.status, 201);
    const route = '/api/watchlist/' + second.body.id;
    assert.equal((await request('PATCH', route, { symbol: ' msft ' })).status, 200);
    assert.equal((await request('PATCH', route, { symbol: 'aapl' })).status, 409);
    assert.equal((await request('GET', route)).body.symbol, 'MSFT');
  }));

  test('invalid symbols return 400, while symbols without a quote can still be saved', async () => withApp(async request => {
    for (const symbol of ['', '123', 'TOOLOOONG', 'AA/BB', null, 42]) {
      assert.equal((await request('POST', '/api/watchlist', { symbol })).status, 400, String(symbol));
    }
    assert.equal((await request('POST', '/api/watchlist', { symbol: 'IBM' })).status, 201);
    assert.equal((await request('GET')).body.length, 1);
  }));

  test('prices use positive integer cents, rejecting decimals, strings, and unsafe values', async () => withApp(async request => {
    for (const value of [0, -1, 187.25, '18725', 100000001, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal((await request('POST', '/api/watchlist', { symbol: 'AAPL', targetPriceCents: value })).status, 400, String(value));
    }
    const created = await request('POST', '/api/watchlist', { symbol: 'AAPL', targetPriceCents: 18725 });
    assert.equal(created.status, 201);
    assert.equal(created.body.targetPriceCents, 18725);
  }));

  test('rejects long notes, unknown/read-only fields, empty patches, and malformed JSON', async () => withApp(async (request, base) => {
    for (const body of [[], null, {}, { symbol: 'AAPL', notes: 'x'.repeat(301) }, { symbol: 'AAPL', notes: 1 }, { symbol: 'AAPL', typo: true }, { symbol: 'AAPL', id: 'forged' }]) {
      assert.equal((await request('POST', '/api/watchlist', body)).status, 400);
    }
    const created = await request('POST', '/api/watchlist', { symbol: 'AAPL', notes: 'x'.repeat(300) });
    assert.equal(created.status, 201);
    for (const body of [{}, { createdAt: 'changed' }, { notes: 'x'.repeat(301) }]) {
      assert.equal((await request('PATCH', '/api/watchlist/' + created.body.id, body)).status, 400);
    }
    const malformed = await fetch(base + '/api/watchlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken' });
    assert.equal(malformed.status, 400);
    await malformed.text();
  }));

  test('DELETE returns an empty 204; repeated delete, read, and update return 404', async () => withApp(async request => {
    const created = await request('POST', '/api/watchlist', { symbol: 'AAPL' });
    assert.equal(created.status, 201);
    const route = '/api/watchlist/' + created.body.id;
    const deleted = await request('DELETE', route);
    assert.equal(deleted.status, 204);
    assert.equal(deleted.body, null);
    assert.equal((await request('DELETE', route)).status, 404);
    assert.equal((await request('GET', route)).status, 404);
    assert.equal((await request('PATCH', route, { notes: 'Missing' })).status, 404);
    assert.deepEqual((await request('GET')).body, []);
  }));

  test('storage failures return generic 500 and unexpected routes return 404', async () => withApp(async request => {
    const failed = await request('POST', '/api/watchlist', { symbol: 'AAPL' });
    assert.equal(failed.status, 500);
    assert.deepEqual(failed.body, { error: 'Internal error' });
    assert.equal((await request('GET', '/api/unexpected')).status, 404);
  }, store => {
    store.create = () => { throw new Error('Private connection detail must not escape'); };
  }));
}

module.exports = { registerChecks };
