// Reference solutions. Try QUESTIONS.md and HINTS.md first.
function orderCostCents(priceCents, quantity) {
  if (!Number.isSafeInteger(priceCents) || priceCents <= 0 ||
      !Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new TypeError('Price and quantity must be positive safe integers');
  }
  const cost = priceCents * quantity;
  if (!Number.isSafeInteger(cost)) throw new RangeError('Order cost exceeds the safe integer range');
  return cost;
}

function amendPendingOrder(order, patch) {
  if (order.status !== 'pending') throw new Error('Only pending orders can be amended');
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Patch must be an object');
  const keys = Object.keys(patch);
  if (keys.length === 0 || keys.some(key => !['quantity', 'limitPriceCents', 'note'].includes(key))) {
    throw new TypeError('Patch must contain only editable order fields');
  }
  if (Object.hasOwn(patch, 'note') && (typeof patch.note !== 'string' || patch.note.length > 120)) {
    throw new TypeError('Note must be a string of at most 120 characters');
  }
  const amended = { ...order, ...patch };
  orderCostCents(amended.limitPriceCents, amended.quantity);
  return amended;
}

async function cancelPendingOrder(store, id) {
  try {
    const order = await store.get(id);
    if (!order) return { status: 404, body: { code: 'ORDER_NOT_FOUND' } };
    if (order.status !== 'pending') return { status: 409, body: { code: 'ORDER_NOT_PENDING' } };
    const cancelled = await store.update(id, { status: 'cancelled' });
    return { status: 200, body: cancelled };
  } catch {
    return { status: 503, body: { code: 'PERSISTENCE_FAILED' } };
  }
}

function utcPracticeDay(timestamp) {
  if (typeof timestamp !== 'string') throw new TypeError('Timestamp must be a UTC ISO string');
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d{3}))?Z$/.exec(timestamp);
  if (!match) throw new TypeError('Timestamp must be a UTC ISO string');
  const date = new Date(timestamp);
  const canonical = `${match[1]}T${match[2]}.${match[3] || '000'}Z`;
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== canonical) {
    throw new TypeError('Timestamp must contain a real calendar date and time');
  }
  return match[1];
}

function quoteForSymbol(quotes, symbol) {
  if (!quotes || typeof quotes !== 'object' || Array.isArray(quotes)) throw new TypeError('Quotes must be a keyed object');
  if (typeof symbol !== 'string' || !symbol.trim()) throw new TypeError('Symbol must be a nonempty string');
  const key = symbol.trim().toUpperCase();
  return Object.hasOwn(quotes, key) ? quotes[key] : null;
}

module.exports = { orderCostCents, amendPendingOrder, cancelPendingOrder, utcPracticeDay, quoteForSymbol };
