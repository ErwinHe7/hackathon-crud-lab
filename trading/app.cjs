const express = require('express');
const path = require('node:path');
const { quotes } = require('./quotes.cjs');

function createApp(store, { reference = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/mode', (req, res) => res.json({ mode: reference ? 'reference' : 'starter' }));
  app.get('/api/quotes', (req, res) => res.json({
    source: 'Deterministic practice fixtures', simulated: true, quotes
  }));
  const { createAPI } = require(reference ? './reference-api.cjs' : './starter-api.cjs');
  app.use('/api/watchlist', createAPI(store));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status === 400 || error.status === 413 ? error.status : 500;
    res.status(status).json({ error: status === 500 ? 'Internal error' : error.message });
  });
  return app;
}

module.exports = { createApp };
