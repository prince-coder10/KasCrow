# Escrow API (playerflip)

This document describes the Escrow HTTP API implemented in this repository. It documents the available routes, request/response shapes, error conditions, relevant implementation files, environment configuration, and usage examples.

**Files**

- [src/routes/escrow.routes.ts](src/routes/escrow.routes.ts) — route definitions.
- [src/escrow/controllers/createEscrow.ts](src/escrow/controllers/createEscrow.ts) — `POST /create` handler.
- [src/escrow/controllers/getEscrowStatus.ts](src/escrow/controllers/getEscrowStatus.ts) — `GET /:id/status` handler.
- [src/escrow/controllers/releaseEscrow.ts](src/escrow/controllers/releaseEscrow.ts) — `POST /:id/release` handler.
- [src/escrow/escrow.service.ts](src/escrow/escrow.service.ts) — core escrow business logic (key generation, transaction creation, release).
- [src/escrow/escrow.store.ts](src/escrow/escrow.store.ts) — persistence layer (mongoose model operations).
- [src/escrow/model/Escrow.ts](src/escrow/model/Escrow.ts) — mongoose schema and types for `Escrow`.
- [src/escrow/escrow.utils.ts](src/escrow/escrow.utils.ts) — encryption helpers used to protect private keys.

**Overview**

The escrow system provides a small workflow for creating on-chain escrows, checking their status, and releasing funds to a vendor.

- Escrows are created with a fresh private key and a derived address. The private key is encrypted before storage.
- A created escrow starts in status: `AWAITING_PAYMENT`.
- The code expects the escrow address to be funded externally (on the Kaspa network). Once funded, a release can be triggered which signs and submits a transaction to send the escrowed `amount` to the `vendorAddress`.

Important implementation notes:

- Escrow private keys are encrypted using `ESCROW_MASTER_SECRET` with an Argon2-derived AES-256-GCM key (see [src/escrow/escrow.utils.ts](src/escrow/escrow.utils.ts)).
- The release flow uses `@kluster/kaspa-wasm-node` utilities to construct/sign transactions and `kaspaRpcService` to fetch UTXOs and submit transactions.
- Escrows in `AWAITING_PAYMENT` are configured to expire automatically via the mongoose TTL index (see model).

Environment variables

- `ESCROW_MASTER_SECRET` (required) — master secret used to derive encryption key for private keys.
- `ESCROW_KEY_SALT` (optional) — salt for Argon2; defaults to `playerflip-escrow-salt`.
- `KASPA_NETWORK` (optional) — network used when deriving addresses; defaults to `testnet-10`.
- The app also requires normal DB connection environment (see [src/config/mongo.ts](src/config/mongo.ts)).

API Routes

Note: the router file is [src/routes/escrow.routes.ts](src/routes/escrow.routes.ts). The examples below assume this router is mounted at `/escrow` (e.g. `app.use('/escrow', escrowRouter)`). Replace the base path if mounted differently.

1. Create escrow

- Method: `POST`
- Path: `/escrow/create`
- Purpose: Generate a new escrow (address + encrypted private key) and persist it.
- Request JSON body:

  ```json
  {
    "amount": 0.1,
    "vendorAddress": "kaspa:..."
  }
  ```

- Validation / errors:

  - `400` when `amount` or `vendorAddress` is missing: `{ error: "amount and vendorAddress required" }`.

- Successful response (200):

  ```json
  {
    "success": true,
    "escrow": {
      "escrowId": "<uuid>",
      "address": "kaspa:...",
      "amount": 0.1,
      "totalAmount": 0.10005,
      "privatekey": "<encrypted-string>",
      "vendorAddress": "kaspa:...",
      "status": "AWAITING_PAYMENT",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```

  - Notes: `totalAmount` includes a small buffer added to cover fees (see `ESCROW_FEE_BUFFER_KAS` in [src/escrow/escrow.service.ts](src/escrow/escrow.service.ts)). The `privatekey` stored in the DB is the encrypted private key (not the plaintext key).

2. Get escrow status

- Method: `GET`
- Path: `/escrow/:id/status`
- Purpose: Return the current status of an escrow by `escrowId`.
- Path params:
  - `id` (string) — escrowId returned at creation.
- Validation / errors:
  - `400` when `id` is invalid or missing: `{ error: "Invalid escrow ID" }`.
  - `404` when no escrow with that id exists: `{ error: "Escrow not found" }`.
- Successful response (200):

  ```json
  { "status": "AWAITING_PAYMENT" }
  ```

  - Possible status values: `AWAITING_PAYMENT`, `FUNDED`, `RELEASED`.

3. Release escrow funds

- Method: `POST`
- Path: `/escrow/:id/release`
- Purpose: Attempt to release funds from the escrow address to the stored `vendorAddress`.
- Path params:
  - `id` (string) — escrowId.
- Behavior and important checks (implemented in [src/escrow/escrow.service.ts](src/escrow/escrow.service.ts)):

  - Ensures escrow exists.
  - Escrow must be in `FUNDED` state to proceed. If status is not `FUNDED`, the handler returns a `400` with an appropriate error message.
  - Private key is decrypted using `ESCROW_MASTER_SECRET`. If decryption fails, the release aborts.
  - The service queries the Kaspa RPC (`kaspaRpcService`) for UTXOs for the escrow address, ensures enough balance exists (including a `priorityFee`), constructs a transaction sending the `amount` to `vendorAddress`, signs it, finalizes and submits it.
  - On success the escrow's `status` is updated to `RELEASED` and `releaseTxId` is saved.

- Possible error responses (examples):

  - `400` `{ error: "Invalid escrow ID" }` — invalid id parameter.
  - `400` `{ error: "Escrow not found" }` — no matching escrow.
  - `400` `{ error: "Escrow already released" }` — cannot re-release.
  - `400` `{ error: "Escrow not funded" }` — release attempted before funding.
  - `400` `{ error: "Escrow underfunded" }` / `{ error: "Escrow underfunded for release + fee" }` — insufficient balance in escrow to pay amount+fee.
  - `400` `{ error: "Escrow balance unavailable or already spent" }` — no UTXOs found / funds already spent.

- Successful response (200):

  ```json
  { "success": true, "txId": "<kaspa-tx-id>" }
  ```

Notes about funding detection and lifecycle

- The repository includes a commented example in `routes/escrow.routes.ts` showing how to check UTXO balance for an escrow address and update the escrow `status` to `FUNDED` when the deposited balance meets or exceeds the escrow `amount`. In the current codebase this is not automated; you can either poll the RPC yourself or implement a background worker to call `getUtxosByAddresses` and then `EscrowService.markEscrowFunded(escrowId, txid)`.
- Escrows created with status `AWAITING_PAYMENT` have a TTL/expiration configured via the mongoose index (see [src/escrow/model/Escrow.ts](src/escrow/model/Escrow.ts)). The model uses `expireAfterSeconds` for `AWAITING_PAYMENT` escrows (configured to 1200 seconds / 20 minutes in the schema). Additionally, `EscrowService.expireUnfundedEscrows()` exists to expire escrows programmatically.

Security considerations

- The private key is encrypted before being persisted. The encryption key is derived from `ESCROW_MASTER_SECRET` using Argon2, then AES-256-GCM is used to encrypt the plaintext private key. Protect `ESCROW_MASTER_SECRET` carefully and rotate if necessary.
- There is no authentication on the routes in the current code. If exposing these endpoints, add authentication (e.g. API keys or JWT) to prevent unauthorized releases.

Running examples (curl)

- Create escrow:

  ```bash
  curl -X POST http://localhost:3000/escrow/create \
    -H 'Content-Type: application/json' \
    -d '{"amount":0.1,"vendorAddress":"kaspa:..."}'
  ```

- Check status:

  ```bash
  curl http://localhost:3000/escrow/<escrowId>/status
  ```

- Release funds:

  ```bash
  curl -X POST http://localhost:3000/escrow/<escrowId>/release
  ```

Developer notes & pointers

- See [src/escrow/escrow.service.ts](src/escrow/escrow.service.ts) for the complete release flow (UTXO fetch, transaction creation via `createTransaction`, signing with `signTransaction`, and submitting via `kaspaRpcService`).
- The escrow model is in [src/escrow/model/Escrow.ts](src/escrow/model/Escrow.ts) and includes timestamps and a TTL index for awaiting payments.
- If you want to automatically mark escrows as `FUNDED` when funds arrive, add a background worker that calls the Kaspa RPC `getUtxosByAddresses` and then `EscrowService.markEscrowFunded(escrowId, txid)`.

Generated from project sources under `src/escrow` and `src/routes` on 2026-02-03.
