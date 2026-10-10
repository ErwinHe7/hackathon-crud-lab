const test = require('node:test');
const assert = require('node:assert/strict');

function registerChecks(implementation) {
  test('totals handle numeric strings as integer cents', () => {
    assert.equal(implementation.totalCents([{ amountCents: '100' }, { amountCents: '200' }]), 300);
    assert.equal(implementation.totalCents([]), 0);
  });
  test('PATCH preserves the title and record identity', () => {
    const existing = { id: 'task-1', title: 'Practice CRUD', status: 'todo' };
    assert.deepEqual(implementation.patchTask(existing, { status: 'done' }), { ...existing, status: 'done' });
    assert.equal(implementation.patchTask(existing, { id: 'attacker' }).id, 'task-1');
  });
  test('the response waits for persistence and contains a record, not a Promise', async () => {
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    let completed = false;
    const response = implementation.saveAndRespond({ save: () => pending }, { title: 'Mock report' }).then(value => { completed = true; return value; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(completed, false, 'response must wait for the write');
    const saved = { id: 'report-1', title: 'Mock report' };
    finish(saved);
    assert.deepEqual(await response, { status: 201, body: saved });
  });
}
module.exports = { registerChecks };
