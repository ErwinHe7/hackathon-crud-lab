# Three debugging exercises

Work only in `exercises/bugs.cjs`. The production API is already working. Start a 45-minute timer and run:

```sh
npm run exercise
```

Initially, all three checks fail on purpose. `npm test` still verifies the working API. Do not weaken the exercise checks to make a failure disappear.

## 1. The total is a string

Input rows contain integer cents encoded as strings: `"100"` and `"200"`. Expected total: numeric `300`. Explain JavaScript's `+` behavior before fixing `totalCents`.

Extension after the basic fix: decide how to reject missing, non-finite, fractional, or unsafe amounts. Then write the tests before changing the implementation. The supplied reference answer covers only the stated valid-input contract.

## 2. Updating status erases the title

An existing task has an ID, title, and status. The caller sends only a status. Expected: the ID and title survive. A supplied replacement ID must not overwrite the existing identity.

Find the required order of object spreads. Explain why a full replacement and a partial update are different contracts.

## 3. Success arrives before the save finishes

The store returns a Promise. The client must receive a saved record only after that Promise resolves. A Promise object in the response body is not a saved record.

The test controls the save completion time. Explain how this relates to the Todo extension's premature success notification and to FinForge's save/response mismatch.

## Check your reasoning

After your edits:

```sh
npm run exercise
npm test
```

When ready to compare, inspect `solutions/bugs.cjs` and run `npm run solutions`. The reference solutions pass the same checks. Write a short note with the symptom, cause, smallest fix, and regression test for each bug.
