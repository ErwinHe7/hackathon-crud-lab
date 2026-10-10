const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { createStore } = require('../src/store.cjs');
const { createApp } = require('./app.cjs');

const reference = process.argv.includes('--reference');
const port = Number(process.env.PORT || 3101);
const directory = path.join(__dirname, '..', 'data');
mkdirSync(directory, { recursive: true });
// Separate databases prevent a reference demonstration from populating a learner's app.
const store = createStore(path.join(directory, reference ? 'watchlist-reference.db' : 'watchlist.db'));
const server = createApp(store, { reference }).listen(port, '127.0.0.1', () => {
  console.log(`Watchlist ${reference ? 'reference' : 'starter'}: http://127.0.0.1:${port}`);
  console.log(reference ? 'Answer key mode. Compare your implementation after trying the checks.' : 'Implement the five TODO handlers in trading/starter-api.cjs.');
});
server.on('error', error => { store.close(); console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => { store.close(); process.exit(0); }));
}
