// Intentionally broken. Implement the contracts in QUESTIONS.md before opening solutions.cjs.
function orderCostCents(priceCents, quantity) {
  return Math.round(Number(priceCents) * Number(quantity));
}

function amendPendingOrder(order, patch) {
  return { ...patch, note: patch.note || '' };
}

async function cancelPendingOrder(store, id) {
  const order = await store.get(id);
  if (!order) return { status: 404, body: { code: 'ORDER_NOT_FOUND' } };
  const cancelled = store.update(id, { status: 'cancelled' });
  return { status: 200, body: cancelled };
}

function utcPracticeDay(timestamp) {
  return new Date(timestamp).toLocaleDateString();
}

function quoteForSymbol(quotes, symbol) {
  return Object.values(quotes)[Number(symbol) || 0] || null;
}

module.exports = { orderCostCents, amendPendingOrder, cancelPendingOrder, utcPracticeDay, quoteForSymbol };
