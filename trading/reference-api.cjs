// Answer key: attempt trading/starter-api.cjs and trading:check before reading.
const express = require('express');
const KIND = 'watchlist';
const SYMBOL = /^[A-Z]{1,6}(?:\.[A-Z]{1,2})?$/;

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function validate(input, patch = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('Expected a JSON object');
  const allowed = ['symbol', 'targetPriceCents', 'notes'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw invalid('Unknown or read-only field');
  if (patch && Object.keys(input).length === 0) throw invalid('Patch must contain at least one field');
  if (!patch && input.symbol === undefined) throw invalid('Symbol is required');
  const output = patch ? {} : { targetPriceCents: null, notes: '' };
  if (input.symbol !== undefined) {
    if (typeof input.symbol !== 'string') throw invalid('Symbol must be text');
    const symbol = input.symbol.trim().toUpperCase();
    if (!SYMBOL.test(symbol)) throw invalid('Symbol must be 1–6 letters with an optional dot suffix of 1–2 letters');
    output.symbol = symbol;
  }
  if (input.targetPriceCents !== undefined) {
    if (input.targetPriceCents !== null && (!Number.isSafeInteger(input.targetPriceCents) || input.targetPriceCents < 1 || input.targetPriceCents > 100000000)) {
      throw invalid('Target price must be null or a positive integer in cents, at most 100000000');
    }
    output.targetPriceCents = input.targetPriceCents;
  }
  if (input.notes !== undefined) {
    if (typeof input.notes !== 'string' || input.notes.length > 300) throw invalid('Notes must be text of at most 300 characters');
    output.notes = input.notes;
  }
  return output;
}

function createAPI(store) {
  const router = express.Router();
  const duplicate = (symbol, id) => store.list(KIND).some(record => record.symbol === symbol && record.id !== id);
  const missing = res => res.status(404).json({ error: 'Watchlist entry not found' });
  router.get('/', (req, res) => res.json(store.list(KIND)));
  router.get('/:id', (req, res) => {
    const record = store.get(KIND, req.params.id);
    if (!record) return missing(res);
    res.json(record);
  });
  router.post('/', (req, res) => {
    const input = validate(req.body);
    if (duplicate(input.symbol)) return res.status(409).json({ error: 'That symbol is already on your watchlist' });
    const record = store.create(KIND, input);
    res.location('/api/watchlist/' + record.id).status(201).json(record);
  });
  router.patch('/:id', (req, res) => {
    const patch = validate(req.body, true);
    if (!store.get(KIND, req.params.id)) return missing(res);
    if (patch.symbol && duplicate(patch.symbol, req.params.id)) return res.status(409).json({ error: 'That symbol is already on your watchlist' });
    res.json(store.update(KIND, req.params.id, patch));
  });
  router.delete('/:id', (req, res) => {
    if (!store.delete(KIND, req.params.id)) return missing(res);
    res.status(204).end();
  });
  return router;
}

module.exports = { createAPI };
