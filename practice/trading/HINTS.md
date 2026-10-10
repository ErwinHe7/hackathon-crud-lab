# Progressive hints

Try the behavior checks before opening a hint. Read one hint at a time, then return to your implementation. Worked answers are in `ANSWERS.md`.

## Q1

1. Coercion accepts more values than the contract permits. Which built-in distinguishes safe integer numbers?
2. Check price and quantity separately before multiplying.
3. Valid inputs can still produce an unsafe product. Check the result as well; keep input errors distinct from overflow.

## Q2

1. Think of the current record as the base and the patch as a limited set of overrides.
2. Validate the order's state and the patch's key list before merging. An object spread alone allows immutable-field changes.
3. Check the merged price and quantity, since a patch may supply only one. Test `note: ''` without a truthiness fallback.

## Q3

1. A promise is evidence that an update started, not that it completed.
2. Check missing and non-pending records before attempting the update.
3. Await the update inside a `try`/`catch`; only the confirmed saved value belongs in the success response.

## Q4

1. Locale formatting varies with environment. Your output has a fixed format.
2. Check the input shape, then check the calendar. JavaScript can normalize some impossible dates instead of rejecting them.
3. Normalize the accepted string to three-digit milliseconds and compare it with `toISOString()` after checking for an invalid date.

## Q5

1. A symbol is a key, not a numeric position.
2. Normalize just the requested symbol; the supplied map already has normalized keys.
3. Check own-property existence so inherited properties do not become quote records.

## A1

1. Update one running balance per symbol while scanning the input once.
2. Validate each sell against the quantity available immediately before that sell.
3. A `Map` avoids collisions with object prototype names; convert it to the requested object only at the end.

## A2

1. Keep one winning record and timestamp per symbol.
2. `Date.parse` turns both supported formats into comparable milliseconds.
3. Replace the winner on greater-or-equal time so equal-time rows follow the stated input-order rule.

## Math

1. Convert dollars to cents before multiplying or subtracting.
2. For M2, deduct the fixed fee first, then take the floor of the affordable quantity.
3. For M3, use sale-price minus purchase-price per sold share. The held shares use current quote minus purchase price. Percentage change divides by the starting price.
