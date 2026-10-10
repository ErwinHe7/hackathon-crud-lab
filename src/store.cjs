const { DatabaseSync } = require('node:sqlite');
const { randomUUID } = require('node:crypto');

function createStore(filename = ':memory:') {
  const database = new DatabaseSync(filename);
  database.exec(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL
  ) STRICT;`);
  const insert = database.prepare('INSERT INTO records (id, kind, payload) VALUES (?, ?, ?)');
  const select = database.prepare('SELECT payload FROM records WHERE kind = ? AND id = ?');
  const list = database.prepare('SELECT payload FROM records WHERE kind = ? ORDER BY rowid');
  const update = database.prepare('UPDATE records SET payload = ? WHERE kind = ? AND id = ?');
  const remove = database.prepare('DELETE FROM records WHERE kind = ? AND id = ?');
  const get = (kind, id) => {
    const row = select.get(kind, id);
    return row ? JSON.parse(row.payload) : null;
  };
  return {
    get,
    list(kind) { return list.all(kind).map(row => JSON.parse(row.payload)); },
    create(kind, input) {
      const record = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
      insert.run(record.id, kind, JSON.stringify(record));
      return record;
    },
    update(kind, id, patch) {
      const existing = get(kind, id);
      if (!existing) return null;
      const record = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt };
      update.run(JSON.stringify(record), kind, id);
      return record;
    },
    delete(kind, id) { return remove.run(kind, id).changes > 0; },
    close() { database.close(); }
  };
}
module.exports = { createStore };
