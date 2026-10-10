# Paper trading practice packet

Use this packet alongside the trading CRUD build. Prices and symbols are invented, every store is local and mocked, and these are original practice questions rather than real Goldman Sachs assessment questions.

1. Open [QUESTIONS.md](QUESTIONS.md) and attempt a question in `bugs.cjs`.
2. Run its behavior checks. If stuck, read one progressively stronger hint in [HINTS.md](HINTS.md).
3. Explain your fix before checking [ANSWERS.md](ANSWERS.md) and `solutions.cjs`.

From the repository root:

| Command | Purpose | Initial expected result |
| --- | --- | --- |
| `npm run trading:exercise` | Five debugging questions in `bugs.cjs` | 5 failing tests until you repair them |
| `npm run trading:solutions` | Reference fixes against the same checks | 5 passing tests |
| `node --test --test-name-pattern='Q1:' practice/trading/exercise.test.cjs` | Attempt only the order-cost question | Q1 fails until repaired |

The equivalent direct commands are `node --test practice/trading/exercise.test.cjs` and `node --test practice/trading/solutions.test.cjs`.

For a **45-minute diagnostics mock**, attempt Q1, Q2, and Q3 for 15 minutes each: validate order cost, amend a pending order, and persist a cancellation before confirming it. Use Q3–Q5 for another 45-minute round.

For a **30-minute fundamentals mock**, implement A1 and A2 for 15 minutes each: aggregate positions while preventing oversells, and retain the latest quote per symbol in one pass. Both questions include examples and complexity prompts.

For a **22-minute math mock**, attempt M1 for 7 minutes, M2 for 7 minutes, and M3 for 8 minutes: remaining cash, whole-share affordability, and realized versus unrealized change. Questions and answers are in separate files so you can attempt them first.

Five test names cover several assertions each, including unsafe integers, immutable fields, repeated cancellation, failed persistence, invalid dates, and insertion-independent quote lookup. The reference fake store does not model concurrent fills and cancellations; the question explains the extra atomic update needed in a real system.
