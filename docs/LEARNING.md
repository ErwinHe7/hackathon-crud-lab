# Learn by predicting, running, and explaining

Start with the Todo API, then the extension, then FinForge. Keep the ML component for later: HTTP requests, validation, persistence, and async control flow are the most useful overlap with the diagnostics exercise in the supplied screenshot.

## Session 1: Follow a request, 30 minutes

Open `src/app.cjs` and find `app.post`. Say the path out loud:

1. Express parses the JSON body.
2. The route selects `tasks` or `reports`.
3. `validate` rejects malformed input and returns allowed fields.
4. `store.create` saves a record and generates its identity.
5. The route returns `201` with the actual saved record.

Before `npm run demo`, predict the status code and response for each step. Then run it and compare. Find where an empty title becomes `400`. Change the title in the demo and run again.

## Session 2: Do CRUD yourself, 45 minutes

Run `npm start`, then use the PowerShell requests in the README. Create two tasks. Read both, change only one status, and delete the other. Restart the server and confirm the remaining task survives.

Explain why `PATCH {"status":"done"}` must preserve the title. The merge happens in `src/store.cjs`; validation prevents callers from changing the ID. Explain why a missing ID returns `404` and a successful deletion has no response body.

Add one small feature, such as filtering by priority. First write an API test for the expected results, then implement the filter, then run all tests. A new feature is complete when it preserves existing CRUD behavior.

## Session 3: Study the actual winners, 45 minutes

### Awesome Todo Maintainer

Open your [Todo API](https://github.com/ErwinHe7/awesome-todo-maintainer-integration) in this order: `server.js`, `middleware/auth.js`, `app.js`, `test/read-todo.test.cjs`.

The original API uses `/createTodo`, `/readTodo`, `/updateTodo`, and `/deleteTodo`; several writes use POST. It stores data through the Notion SDK. Our practice API uses conventional REST methods and a local SQLite database so you can practice offline. The original module's failure contract is `{success:false}`, even when the HTTP request itself completed.

Inspect `readTodo`. A missing `Priority` property originally threw during mapping, so the entire list failed. Trace the difference between `properties?.Priority.select` and `properties?.Priority?.select`. Ask where array access also needs a guard. The regression tests include one complete record and one sparse record so the fix cannot silently drop either.

Open your [extension](https://github.com/ErwinHe7/awesome-todo-maintainer-extension), then read `extension.js` and `test/mutation-timing.test.cjs`. Before the fix, an argument to `.then(...)` called the notification immediately. Your fork awaits the POST, checks `response.data.success`, and only then announces success. Test the pending, confirmed, business-failure, and network-failure cases. Explain why a resolved Promise does not by itself mean the business operation succeeded.

The isolated tests run with Node alone:

```sh
node --test test/read-todo.test.cjs
```

Run that command inside the API fork; inside the extension fork use `node --test test/mutation-timing.test.cjs`. These tests do not require tokens, a live VS Code host, or deployed endpoints.

### FinForge

Open [Double-Fraud](https://github.com/ErwinHe7/Double-Fraud) in this order: `client/src/pages/Report.jsx`, `routes/post.js`, `models/postMod.js`, `client/src/pages/Library.jsx`, `test/create-report.test.cjs`.

The form sends `PUT /api/post`. The original route saved a document but tried to respond with an undefined variable named `data`. That produced `500` after the write had succeeded. Retrying could create duplicate reports. Your fork returns the saved document with `201`. The existing route method stays the same, keeping the client contract.

Run `node --test test/create-report.test.cjs` inside the fork. The test records how many saves occurred and checks the saved identity in the response. It never connects to MongoDB. The companion [HopHacks](https://github.com/ErwinHe7/HopHacks) repository had the same response bug in `routes/report.js` and receives the equivalent fix and tests.

FinForge's report routes provide create, list, comments, and votes. They do not implement a complete edit/delete workflow. The new practice API adds full report CRUD. Treat this distinction as an exercise in reading what code actually supports.

## Session 4: Debug under a timer, 45 minutes

Follow [EXERCISES.md](EXERCISES.md). Keep reference answers closed. Write a one-sentence hypothesis before changing code. After each fix, explain why the existing failure happened and which test prevents its return.

Use this time budget:

| Minutes | Action |
| --- | --- |
| 0–5 | Read the problem and identify how to run the affected test |
| 5–15 | Reproduce the failure with the smallest relevant input |
| 15–30 | Trace the request or data and make a focused fix |
| 30–40 | Run regression tests and inspect the diff |
| 40–45 | Explain the cause, change, and evidence |

## Session 5: A mock assessment

The screenshot describes 30 minutes of data structures/algorithms, 45 minutes of diagnostics, and 22 minutes of math. Rehearse those as separate blocks. It does not identify the actual framework or a CRUD task.

For JavaScript fundamentals, practice arrays, `Map`, `Set`, sorting, complexity, and edge cases such as empty input and duplicates. Choose unfamiliar algorithm exercises so you must explain your approach. For math, use separate timed practice; the screenshot does not specify the topics. For diagnostics, use a bug you have not already memorized.

## Make your next meaningful contribution

1. Pick one issue you can reproduce in a disposable local environment.
2. Write a test for the behavior you want.
3. Implement the smallest change that makes that test pass.
4. Run the existing tests and inspect `git diff`.
5. Commit with a message describing the behavior, such as `Preserve task titles during status updates`.

In this standalone lab, commits on `main` can qualify for your graph. In a fork, merging an upstream pull request is needed for those commits to qualify. Do not count fork creation as completed engineering work. The current changes are in your own repositories; no pull requests were sent to the original maintainers.
