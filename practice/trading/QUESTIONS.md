# Paper trading practice questions

These invented questions are for JavaScript practice. They are not Goldman Sachs or HackerRank assessment questions. All symbols, prices, timestamps, fees, and orders below are synthetic. No live trading account, market data, or exchange rules are involved.

Start with `bugs.cjs`. Keep `solutions.cjs` and `ANSWERS.md` closed until you can explain your fix. All exercises use Node built-ins and local fake stores.

From the repository root:

```powershell
node --test practice/trading/exercise.test.cjs
node --test practice/trading/solutions.test.cjs
```

The starter contains exactly five intentionally failing tests. The reference contains five passing tests. Each test represents one question and checks several behaviors; passing the first assertion is not enough.

## Mock schedule

| Session | Time | Questions | Deliverable |
| --- | --- | --- | --- |
| Software diagnostics | 45 minutes | Q1, Q2, Q3, 15 minutes each | Repair the three functions and explain root cause, test evidence, and one boundary case each |
| Software fundamentals | 30 minutes | A1 and A2, 15 minutes each | Implement each function in your own scratch file; state time and space complexity |
| Math | 22 minutes | M1: 7 minutes; M2: 7 minutes; M3: 8 minutes | Show integer-cent working, then select or write the answer |

For another diagnostics round, attempt Q3, Q4, and Q5 for 15 minutes each. Q4 and Q5 can also be isolated 10-minute drills followed by five minutes explaining the result. The schedule is a practice format, not a claim about actual assessment content.

## Q1 — Validate a whole-share order, 15 minutes

Implement `orderCostCents(priceCents, quantity)`.

- Inputs must be JavaScript numbers that are positive safe integers. Numeric strings, fractional cents, fractional shares, zero, negative values, `NaN`, infinity, and unsafe integers must throw `TypeError`.
- Return `priceCents * quantity` as integer cents. An otherwise valid order whose total is not a safe integer must throw `RangeError`.
- There are no fees in this function. Do not round malformed inputs into valid orders.

Examples: `(12345, 3) → 37035`; `(12345, 1.5) → TypeError`; `('12345', 3) → TypeError`; `(Number.MAX_SAFE_INTEGER, 2) → RangeError`.

Explain why JavaScript accepting a value through `Number(...)` is different from validating the API contract.

## Q2 — Amend a pending order, 15 minutes

Implement `amendPendingOrder(order, patch)`. Assume `order` is an existing valid record. Only orders with status `pending` can be amended.

- Editable fields are `quantity`, `limitPriceCents`, and `note`. Reject any other key, including identity and status fields. Reject an empty patch, `null`, or an array.
- Preserve every omitted field. Return a new object without changing the original.
- The resulting quantity, limit price, and total must satisfy Q1. A note, if supplied, must be a string with at most 120 characters; `''` deliberately clears it.
- Throw on a `filled` or `cancelled` order. This exercise does not model modifying an already executed order.

Example: `{id:'o1', symbol:'ALFA', side:'buy', status:'pending', quantity:3, limitPriceCents:12345, note:'Draft'}` with `{quantity:4}` retains the ID, symbol, side, status, price, and note, changing only quantity.

Explain the difference between an omitted field and an explicitly supplied empty string.

## Q3 — Confirm cancellation after persistence, 15 minutes

Implement asynchronous `cancelPendingOrder(store, id)`. The fake store has `get(id)` and `update(id, patch)` methods. Both can return promises.

- Missing order: return `{status:404, body:{code:'ORDER_NOT_FOUND'}}` without updating.
- Existing order whose status is not `pending`: return `{status:409, body:{code:'ORDER_NOT_PENDING'}}` without updating. This also makes a repeated cancellation fail visibly.
- Pending order: persist `{status:'cancelled'}` and only then return `{status:200, body:savedOrder}`.
- Store failure: return `{status:503, body:{code:'PERSISTENCE_FAILED'}}` instead of announcing success or leaking the internal exception.

The response body must contain the saved record, not a promise. The test holds the update unresolved to check response timing.

The fake store is isolated and calls are sequential. For a real concurrent system, a read followed by an update needs an atomic conditional update or transaction to prevent a fill-versus-cancel race; implementing that is outside this question.

## Q4 — Group records by a deterministic UTC practice day, 10 minutes

Implement `utcPracticeDay(timestamp)` and return `YYYY-MM-DD`.

- Accept only strings in `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DDTHH:mm:ss.sssZ` format.
- Reject invalid calendar dates and invalid clock times, date-only input, numeric input, timezone offsets, and milliseconds of any length other than three digits. Throw `TypeError` on invalid input.
- The output must not depend on the computer's locale or timezone. Leap-day validation matters.

Examples: `'2026-10-10T00:05:00Z' → '2026-10-10'`; `'2024-02-29T12:00:00Z' → '2024-02-29'`; `'2026-02-30T12:00:00Z' → TypeError`.

This is a UTC grouping exercise, not the definition of an exchange trading day, which can depend on market timezone and calendar.

## Q5 — Find a quote by its symbol, 10 minutes

Implement `quoteForSymbol(quotes, symbol)`.

- `quotes` is a keyed object of valid synthetic quote records, such as `{BRAVO:{symbol:'BRAVO',priceCents:8000}, ALFA:{symbol:'ALFA',priceCents:12345}}`. Reject `null`, arrays, and non-object input with `TypeError`.
- The symbol must be a nonempty string after trimming; otherwise throw `TypeError`. Normalize it to uppercase.
- Return the matching own-property record. Return `null` for a missing symbol, including inherited object properties. Insertion order must not affect the answer.

Example: `quoteForSymbol(quotes, ' alfa ')` returns the ALFA record, even though BRAVO was inserted first.

## A1 — Aggregate paper positions, 15 minutes

Write `netPositions(trades)`. Each trade has `{symbol, side, quantity}`. Input is already ordered by execution time; symbols are normalized strings and quantities are positive safe integers. Side is `buy` or `sell`. Start with zero shares for each symbol and allow no short positions.

Return an object mapping each seen symbol to its final whole-share quantity, retaining zero balances. Throw an error if a sell exceeds the current quantity at that point, even if a later buy would cover it. Reject unsafe resulting quantities. Assume each input trade itself is already validated.

```javascript
[
  { symbol: 'ALFA', side: 'buy', quantity: 3 },
  { symbol: 'BRAVO', side: 'buy', quantity: 2 },
  { symbol: 'ALFA', side: 'sell', quantity: 1 }
]
// Expected: { ALFA: 2, BRAVO: 2 }
```

Attempt these cases: no trades; buy 2 then sell 2; sell 1 then buy 2; buys for three symbols interleaved. Explain why sorting by symbol is unnecessary and why checking only the final quantity misses an oversell.

## A2 — Keep the latest synthetic quote per symbol, 15 minutes

Write `latestQuotes(rows)`. Each row has `{symbol, priceCents, timestamp}`. Inputs are already valid: symbols are uppercase, prices are positive safe integer cents, and timestamps are valid UTC ISO strings in the formats accepted by Q4.

Return an object mapping each symbol to its latest complete quote record. On equal instants, keep the row occurring later in the input. Do not mutate the rows. An empty list returns `{}`.

```javascript
[
  { symbol: 'ALFA', priceCents: 1000, timestamp: '2026-10-10T12:00:00Z' },
  { symbol: 'BRAVO', priceCents: 2000, timestamp: '2026-10-10T12:01:00Z' },
  { symbol: 'ALFA', priceCents: 1050, timestamp: '2026-10-10T12:02:00Z' },
  { symbol: 'ALFA', priceCents: 1060, timestamp: '2026-10-10T12:02:00.000Z' }
]
// Expected: ALFA has 1060 cents; BRAVO has 2000 cents, with their full records retained.
```

Explain why sorting is unnecessary and why mixed ISO strings with and without milliseconds should be compared as timestamps rather than by raw text.

## M1 — Cash balance, 7 minutes

A simulated account starts with $500.00. It buys 3 whole shares at $12.34 each and pays one $1.25 order fee. What cash remains?

A. $462.98 · B. $461.73 · C. $462.73 · D. $461.48

## M2 — Whole shares under a budget, 7 minutes

You have $75.00 of simulated cash. Each whole share costs $12.40. There is one fixed $0.60 fee if you place this order. What is the maximum whole-share quantity, and how much cash remains after buying it? No fractional shares or other fees are allowed.

## M3 — Realized and unrealized change, 8 minutes

A simulated account buys 8 shares at $25.00, later sells 3 at $28.00, and still holds 5. The current synthetic quote is $27.00. Ignore fees and taxes and use the $25.00 purchase price as the cost basis for every share.

Find: (a) realized profit on the 3 sold shares, (b) unrealized profit on the 5 held shares, (c) their sum, and (d) the percentage price increase from $25.00 to $28.00.

Do not treat sale proceeds as profit. Explain which part changes when the synthetic current quote changes but no new sale occurs.
