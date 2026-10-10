# Request flows

## Original Todo project

```mermaid
flowchart LR
    A[VS Code command] --> B[Axios request]
    B --> C[Express route in server.js]
    C --> D[Notion client from middleware/auth.js]
    D --> E[CRUD function in app.js]
    E --> F[Notion SDK]
    F --> G[Result with success flag]
    G --> H[Extension notification]
```

The extension must wait for the request and check the result's success flag before notifying. During a read, optional fields must not make an otherwise readable list fail.

## Original FinForge web app

```mermaid
flowchart LR
    A[Report.jsx form] -->|PUT /api/post| B[routes/post.js]
    B --> C[Post model in models/postMod.js]
    C --> D[MongoDB save]
    D --> E[Saved document]
    E -->|201 with document| F[Client response]
    G[Library.jsx] --> H[List reports through API]
```

The previous route reached the successful save, then failed while constructing its response. Your fork fixes that response. The companion backend's `routes/report.js` has the analogous flow. Read `lib/utils.js` and `models/train.py` later for its URL-feature and ML work; these are optional for the CRUD lesson.

## Local practice lab

```mermaid
flowchart LR
    A[PowerShell request or demo] --> B[Express app.cjs]
    B --> C[validation.cjs]
    C --> D[store.cjs]
    D --> E[SQLite prepared statements]
    E --> F[Saved record or missing ID]
    F --> G[HTTP response]
```

The route controls HTTP behavior; validation controls accepted fields; the store controls persistence. The HTTP tests use temporary local servers. Persistence tests close and reopen a disposable database. None of those checks access the original live integrations.
