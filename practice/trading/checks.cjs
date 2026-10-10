const { test } = require('node:test');
const assert = require('node:assert/strict');

function registerChecks(implementation) {
  const { orderCostCents, amendPendingOrder, cancelPendingOrder, utcPracticeDay, quoteForSymbol } = implementation;

  test('Q1: whole shares and integer cents stay exact and within safe bounds', () => {
    assert.equal(orderCostCents(12345, 3), 37035);
    for (const pair of [[12345, 1.5], ['12345', 3], [123.45, 3], [100, 0], [-100, 2], [100, NaN], [100, Infinity], [Number.MAX_SAFE_INTEGER + 1, 1], [1, Number.MAX_SAFE_INTEGER + 1]]) {
      assert.throws(() => orderCostCents(...pair), TypeError);
    }
    assert.throws(() => orderCostCents(Number.MAX_SAFE_INTEGER, 2), RangeError);
    assert.equal(orderCostCents(1, Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
  });

  test('Q2: amendments preserve identity and reject forbidden fields and states', () => {
    const order = { id: 'o1', symbol: 'ALFA', side: 'buy', status: 'pending', quantity: 3, limitPriceCents: 12345, note: 'First draft', createdAt: '2026-10-10T12:00:00Z' };
    const amended = amendPendingOrder(order, { quantity: 4 });
    assert.deepEqual(amended, { ...order, quantity: 4 });
    assert.equal(order.quantity, 3, 'Do not mutate the original record');
    assert.equal(amendPendingOrder(order, { note: '' }).note, '', 'An empty note deliberately clears it');
    assert.equal(amendPendingOrder(order, { note: 'a'.repeat(120) }).note.length, 120);
    assert.equal(amendPendingOrder(order, { limitPriceCents: 12500 }).limitPriceCents, 12500);
    for (const patch of [{ id: 'replacement' }, { symbol: 'BRAVO' }, { status: 'filled' }, {}, null, [], { quantity: 0 }, { quantity: 1.5 }, { limitPriceCents: '100' }, { limitPriceCents: Number.MAX_SAFE_INTEGER }, { note: null }, { note: 'a'.repeat(121) }]) {
      assert.throws(() => amendPendingOrder(order, patch));
    }
    assert.throws(() => amendPendingOrder({ ...order, status: 'filled' }, { quantity: 4 }));
    assert.throws(() => amendPendingOrder({ ...order, status: 'cancelled' }, { quantity: 4 }));
  });

  test('Q3: cancellation responds only after persistence and enforces pending state', async () => {
    const order = { id: 'o1', symbol: 'ALFA', status: 'pending' };
    let completeUpdate;
    const delayed = new Promise(resolve => { completeUpdate = resolve; });
    let responded = false;
    const pending = cancelPendingOrder({
      get: async id => { assert.equal(id, 'o1'); return order; },
      update: (id, patch) => { assert.equal(id, 'o1'); assert.deepEqual(patch, { status: 'cancelled' }); return delayed; }
    }, 'o1').then(result => { responded = true; return result; });
    await new Promise(resolve => setImmediate(resolve));
    try {
      assert.equal(responded, false, 'A pending database update is not a confirmed cancellation');
    } finally {
      completeUpdate({ ...order, status: 'cancelled' });
    }
    assert.deepEqual(await pending, { status: 200, body: { ...order, status: 'cancelled' } });
    let updates = 0;
    const update = async () => { updates++; throw new Error('Must not update'); };
    assert.deepEqual(await cancelPendingOrder({ get: async () => null, update }, 'missing'), { status: 404, body: { code: 'ORDER_NOT_FOUND' } });
    for (const status of ['filled', 'cancelled']) {
      assert.deepEqual(await cancelPendingOrder({ get: async () => ({ ...order, status }), update }, 'o1'), { status: 409, body: { code: 'ORDER_NOT_PENDING' } });
    }
    assert.equal(updates, 0);
    assert.deepEqual(await cancelPendingOrder({ get: async () => order, update: async () => { throw new Error('Offline'); } }, 'o1'), { status: 503, body: { code: 'PERSISTENCE_FAILED' } });
    assert.deepEqual(await cancelPendingOrder({ get: async () => { throw new Error('Offline'); }, update }, 'o1'), { status: 503, body: { code: 'PERSISTENCE_FAILED' } });
  });

  test('Q4: practice-day grouping uses validated ISO UTC calendar dates', () => {
    assert.equal(utcPracticeDay('2026-10-10T00:05:00Z'), '2026-10-10');
    assert.equal(utcPracticeDay('2026-10-10T23:59:59.123Z'), '2026-10-10');
    assert.equal(utcPracticeDay('2024-02-29T12:00:00Z'), '2024-02-29');
    for (const timestamp of ['2026-02-30T12:00:00Z', '2025-02-29T12:00:00Z', '2026-10-10T24:00:00Z', '2026-10-10', '10/10/2026', '2026-10-10T12:00:00-04:00', '2026-10-10T12:00:00.1Z', null]) {
      assert.throws(() => utcPracticeDay(timestamp), TypeError);
    }
  });

  test('Q5: quote lookup uses a normalized symbol key independent of insertion order', () => {
    const alfa = { symbol: 'ALFA', priceCents: 12345 };
    const bravo = { symbol: 'BRAVO', priceCents: 8000 };
    const quotes = { BRAVO: bravo, ALFA: alfa };
    assert.deepEqual(quoteForSymbol(quotes, ' alfa '), alfa);
    assert.deepEqual(quoteForSymbol({ ALFA: alfa, BRAVO: bravo }, 'BRAVO'), bravo);
    assert.equal(quoteForSymbol(quotes, 'MISSING'), null);
    assert.equal(quoteForSymbol(quotes, 'toString'), null, 'Inherited object properties are not quote records');
    assert.equal(quoteForSymbol(Object.create({ ALFA: alfa }), 'ALFA'), null, 'Inherited symbol records are not own quotes');
    for (const symbol of ['', ' ', null, 0]) assert.throws(() => quoteForSymbol(quotes, symbol), TypeError);
    assert.throws(() => quoteForSymbol([alfa, bravo], 'ALFA'), TypeError);
  });
}

module.exports = { registerChecks };
