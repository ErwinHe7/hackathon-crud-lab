const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./store.cjs');
const { createApp } = require('./app.cjs');
const folder = path.join(__dirname, '../data');
fs.mkdirSync(folder, { recursive: true });
const store = createStore(path.join(folder, 'practice.db'));
const port = Number(process.env.PORT || 3100);
const server = createApp(store).listen(port, '127.0.0.1', () => {
  console.log(`CRUD lab: http://127.0.0.1:${server.address().port}`);
});
server.on('error', error => { store.close(); console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => store.close()));
