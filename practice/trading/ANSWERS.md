# Worked answers — open after attempting the questions

All figures and scenarios are invented for practice. They do not involve live prices or investment recommendations.

## Diagnostics Q1–Q5

The runnable reference is `solutions.cjs`. Its five tests share the same behavior checks as the starter, so solutions do not receive an easier test suite.

1. **Q1:** Validate positive safe integer numbers before arithmetic, then check the product. At 12,345 cents times 3 shares, cost is 37,035 cents. Coercing a numeric string or rounding fractional shares silently changes the specified API. `Number.MAX_SAFE_INTEGER * 2` exceeds the allowed range even though each input is valid.
2. **Q2:** Require pending state and a nonempty patch containing only editable keys. Merge `{...order, ...patch}`, validate the resulting whole-share quantity and price, and return a new object. Validate notes only when present; an empty string deliberately clears the note. Filled and cancelled orders reject amendments.
3. **Q3:** Read the record, reject missing or non-pending states, then await the update. The delayed-promise test proves no success response escapes before persistence. A persistence rejection becomes 503. This local example does not solve the production race between the initial read and update; that requires a conditional atomic state transition.
4. **Q4:** Validate the exact UTC ISO shape and compare the normalized input to `Date.toISOString()`. This catches calendar normalization such as February 30. Only after checking the calendar is it safe to return the first ten characters. Locale formatting is unnecessary.
5. **Q5:** Trim and uppercase the requested symbol, then use a keyed own-property lookup. ALFA's result is independent of the insertion order. A missing key returns `null`, and an inherited `toString` property is not a quote.

## A1 — One pass over executed trades

```javascript
function netPositions(trades) {
  const positions = new Map();
  for (const trade of trades) {
    const current = positions.get(trade.symbol) ?? 0;
    if (trade.side === 'sell' && trade.quantity > current) {
      throw new RangeError('Sell exceeds current position');
    }
    const next = current + (trade.side === 'buy' ? trade.quantity : -trade.quantity);
    if (!Number.isSafeInteger(next)) throw new RangeError('Unsafe position quantity');
    positions.set(trade.symbol, next);
  }
  return Object.fromEntries(positions);
}
```

The question assumes validated sides, symbols, and individual quantities. The sample ends with `{ALFA:2, BRAVO:2}`. Buy 2 then sell 2 leaves `{ALFA:0}`. Sell 1 before any buy rejects immediately, even if a later buy would leave a positive final quantity.

Time is O(n) for n trades; extra space is O(s) for s distinct symbols. No sorting is necessary because input is already in execution order.

## A2 — One winning quote per symbol

```javascript
function latestQuotes(rows) {
  const winners = new Map();
  for (const row of rows) {
    const time = Date.parse(row.timestamp);
    const current = winners.get(row.symbol);
    if (!current || time >= current.time) {
      winners.set(row.symbol, { time, row });
    }
  }
  return Object.fromEntries(
    [...winners].map(([symbol, winner]) => [symbol, winner.row])
  );
}
```

The question assumes valid timestamp strings. The final ALFA quote is 1,060 cents at `2026-10-10T12:02:00.000Z`; BRAVO remains 2,000 cents at `2026-10-10T12:01:00Z`. The two ALFA strings with and without `.000` represent the same instant, so the later input row wins.

Time is O(n); extra space is O(s). The function returns existing record references but does not mutate them. Copy each winning record if the caller specifically needs independently editable results.

## M1 — B, $461.73

Initial cash: 50,000 cents. Shares: `3 × 1,234 = 3,702` cents. Add the single 125-cent fee: 3,827 cents debited. Remaining cash: `50,000 − 3,827 = 46,173` cents, or **$461.73**.

## M2 — 6 shares, $0.00 remains

Cash after reserving the fee: `7,500 − 60 = 7,440` cents. Maximum whole shares: `floor(7,440 / 1,240) = 6`. Total debit: `6 × 1,240 + 60 = 7,500` cents. Remaining cash is **zero**. Seven shares would exceed the budget.

## M3 — $9 realized, $10 unrealized, $19 combined, 12% price increase

- Sold shares: `3 × (2,800 − 2,500) = 900` cents of realized profit, or **$9.00**.
- Held shares: `5 × (2,700 − 2,500) = 1,000` cents of unrealized profit, or **$10.00**.
- Sum: `900 + 1,000 = 1,900` cents, or **$19.00**.
- Sale-price increase: `(2,800 − 2,500) / 2,500 × 100 = 12%`.

The sale generates $84.00 of proceeds, but only $9.00 is profit relative to the $75.00 cost of those three shares. A changed quote affects unrealized profit on held shares; it does not change the already realized $9.00 when no further sale occurs.
