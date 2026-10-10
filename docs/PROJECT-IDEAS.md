# Trading projects to study after PaperTrade Desk

Start with this lab's **PaperTrade Desk**: implement a watchlist, then a synthetic trade journal, then portfolio calculations. Keep prices fixed while learning so every request and test has a predictable result.

The difficulty labels below are my judgment about learning scope. Sources were checked on **2026-10-10**. These are independent learning references; they are not Goldman assessment questions. No new forks or accounts are required to read them.

## 1. Ghostfolio — intermediate: portfolio and transaction CRUD

[Ghostfolio](https://github.com/ghostfolio/ghostfolio) tracks investments, accounts, and transactions. Its stack is TypeScript, Angular, NestJS, PostgreSQL, Prisma, and Redis. It documents creating, editing, and deleting transactions. Its own code is licensed under [AGPL-3.0](https://github.com/ghostfolio/ghostfolio/blob/main/LICENSE).

Read just the [activities controller](https://github.com/ghostfolio/ghostfolio/blob/main/apps/api/src/app/activities/activities.controller.ts) first. Identify the create/read/update/delete methods, the user ID passed into service queries, and the missing-record responses. Then compare the records with the [Prisma schema](https://github.com/ghostfolio/ghostfolio/blob/main/prisma/schema.prisma).

**Build your version:** add a trade journal containing `symbol`, `side`, `quantity`, `priceCents`, `feeCents`, and `executedAt`. Implement POST, list, PATCH, and DELETE before adding charts. Editing a journal entry corrects a simulated record; it does not execute a trade.

**Debugging challenge:** a lookup filters by record ID but forgets the owner ID. Construct two synthetic users and prove that one cannot read or edit the other's entries.

## 2. kite-paper-node — intermediate to advanced: order state changes

[kite-paper-node](https://github.com/vigsank/kite-paper-node) is a Node.js/TypeScript mock for a broker SDK. Its [MIT license](https://github.com/vigsank/kite-paper-node/blob/main/LICENSE) permits reuse subject to the license terms. Read the actual [order engine](https://github.com/vigsank/kite-paper-node/blob/main/src/core/order-engine.ts): `placeOrder`, `modifyOrder`, `cancelOrder`, and `markFilled` provide a useful progression beyond basic CRUD.

**Build your version:** create pending synthetic orders, edit their quantity, cancel them, and fill them from a hardcoded quote. Represent cancellation as a status change so the order history survives. Keep the adapter entirely local.

**Debugging challenge:** cancellation succeeds after an order has filled. Write a failing test for the transition `filled -> cancelled`, then enforce the allowed transitions. Add a test proving that a second fill cannot debit cash twice.

Its [architecture document](https://github.com/vigsank/kite-paper-node/blob/main/docs/ARCHITECTURE.md) is labelled a pre-implementation draft; use the implemented source to verify behavior.

## 3. paper.fun — advanced: atomic simulated execution

[paper.fun](https://github.com/eeshm/paper.fun) is an [MIT-licensed](https://github.com/eeshm/paper.fun/blob/master/LICENSE) paper-trading project using TypeScript, Express, Next.js, Prisma/PostgreSQL, and Redis. Its setup also uses Bun and Docker. The full application is a larger learning commitment than this lab.

Trace its [Express order routes](https://github.com/eeshm/paper.fun/blob/master/apps/api/src/routes/orders.ts) into the [trading package](https://github.com/eeshm/paper.fun/blob/master/packages/trading/src/orders.ts). The implementation groups the order, execution record, balance changes, and position update in a database transaction and locks balance rows before changing them. The ledger models virtual trades.

**Build your version:** with synthetic starting cash of 10,000 cents, submit two simultaneous buys costing 6,000 cents each. Exactly one may succeed; the balance must stay nonnegative. Keep completed executions as history rather than exposing arbitrary delete operations for them.

**Debugging challenge:** the record saves, then a balance update throws. Prove that the transaction rolls back both changes. This connects async error handling with storage correctness.

## Award-winning inspiration: s24

[s24](https://github.com/akshithambekar/s24) won the **[MLH] Best Use of Solana** category at **HackFax x PatriotHacks 2026**, as listed on [Devpost](https://devpost.com/software/s24). This is a category prize. Its described stack includes Node/Express, PostgreSQL, and a Next.js operations dashboard with orders, fills, positions, and a kill switch.

Study its [data model](https://github.com/akshithambekar/s24/blob/main/infra/schema.sql) for a later dashboard idea: explain where every number displayed in the UI came from. I did not verify an open-source license for this repository, so treat it as a source reference and check its license before reusing code. Start with CRUD and deterministic test data before studying its orchestration or devnet execution.

## A sensible build sequence

1. Watchlist CRUD: validation, duplicate symbols, partial updates, persistence.
2. Trade journal CRUD: integer cents, input boundaries, filtering, sorting.
3. Portfolio summary: quantity, cost basis, realized and unrealized gains from synthetic records.
4. Pending-order workflow: create, modify, cancel, fill; reject invalid transitions.
5. Atomic paper execution: transaction rollback, concurrent orders, duplicate-request protection.

For every feature: predict the result, write one behavior test, implement the smallest change, run it, and explain the request from UI to stored record in your own words.
