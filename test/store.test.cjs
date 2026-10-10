const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../src/store.cjs');

test('records persist across database reopen', t => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'crud-lab-test-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  const filename = path.join(folder, 'test.db');
  let store = createStore(filename);
  const record = store.create('tasks', { title: 'Durable practice', status: 'todo', priority: 'medium' });
  store.close();
  store = createStore(filename);
  try { assert.deepEqual(store.get('tasks', record.id), record); } finally { store.close(); }
});
test('SQL-like IDs are bound as values and do not affect unrelated rows', () => {
  const store = createStore();
  try {
    const record = store.create('tasks', { title: 'Keep me', status: 'todo', priority: 'low' });
    assert.equal(store.get('tasks', "' OR 1=1 --"), null);
    assert.equal(store.delete('tasks', "' OR 1=1 --"), false);
    assert.equal(store.get('tasks', record.id).title, 'Keep me');
  } finally { store.close(); }
});
