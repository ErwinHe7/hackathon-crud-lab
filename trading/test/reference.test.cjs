const { createApp } = require('../app.cjs');
const { registerChecks } = require('./checks.cjs');
registerChecks(store => createApp(store, { reference: true }));
