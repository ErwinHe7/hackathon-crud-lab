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

## PaperTrade Desk: your build-yourself app

```mermaid
flowchart LR
    A[Browser watchlist form] -->|JSON request| B[trading/app.cjs]
    B --> C[Your starter-api.cjs handler]
    C --> D[Validate and normalize fields]
    D --> E[src/store.cjs]
    E --> F[SQLite saved item]
    F --> G[HTTP status and JSON response]
    G --> H[Updated browser list]
    Q[Fixed quote fixtures] --> H
```

The frontend and quote fixtures are supplied. You implement the five watchlist handlers. The reference API is a separate answer key and implements the same contract; it does not replace your starter when you run its checks. See [TRADING-BUILD.md](TRADING-BUILD.md) for the endpoints and build sequence.
