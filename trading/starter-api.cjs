const express = require('express');

function createAPI(store) {
  const router = express.Router();
  const todo = (res, action) => res.status(501).json({
    error: `Starter task: implement ${action} in trading/starter-api.cjs`,
    starter: true
  });

  router.get('/', (req, res) => {
    // TODO READ MANY: return the saved watchlist as a JSON array.
    // Store interface: list(kind), get(kind, id), create(kind, input),
    // update(kind, id, patch), delete(kind, id). Use kind 'watchlist'.
    todo(res, 'GET /api/watchlist');
  });

  router.get('/:id', (req, res) => {
    // TODO READ ONE: fetch by ID; missing records must return 404.
    todo(res, 'GET /api/watchlist/:id');
  });

  router.post('/', (req, res) => {
    // TODO CREATE: validate and normalize input, reject duplicate symbols,
    // save once, and return 201 + Location with the saved record.
    // Read docs/TRADING-BUILD.md for the contract. Write your own validator.
    todo(res, 'POST /api/watchlist');
  });

  router.patch('/:id', (req, res) => {
    // TODO UPDATE: validate only supplied fields; preserve omitted fields.
    // Reject duplicate symbols and changes to id/createdAt; missing ID -> 404.
    todo(res, 'PATCH /api/watchlist/:id');
  });

  router.delete('/:id', (req, res) => {
    // TODO DELETE: delete by ID; return empty 204, or 404 if already absent.
    todo(res, 'DELETE /api/watchlist/:id');
  });
  return router;
}

module.exports = { createAPI };
