# Development guide

## Requirements

- **Node.js** ≥ 20 (see `.nvmrc` for CI parity)
- **npm** 9+

## Install

```bash
npm ci
```

## PEM embedding (`src/generated/pem.ts`)

The Worker loads RSA key material from **`src/generated/pem.ts`**, produced by `scripts/embed-pem.mjs` from PEM files under **`private/certs/`**:

- `private.key`
- `public.key` (used by the embed script for completeness; signing paths use the private key)
- `code-ca.crt`
- `server-child-ca.crt`

If **`private/certs/`** is missing, the script **keeps** an already-committed `pem.ts` and exits successfully. If both are missing, the script **fails** (so CI must commit `pem.ts`).

Regenerate after rotating certs from the Java app build output: `target/classes/external/certificate/`.

```bash
npm run embed-pem
```

`private/certs/` is **gitignored**; **`src/generated/pem.ts` should be committed** for clone-and-deploy flows.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Embed + `wrangler dev` |
| `npm run build` | Embed + Typecheck |
| `npm run check` | `tsc --noEmit` |
| `npm run deploy` | Embed + `wrangler deploy` |
| `npm run test` | Embed + Vitest |
| `npm run test:ci` | Vitest only (run after `npm run build` in CI) |

## Tests

```bash
npm run test
```

Vitest runs in Node; tests live under `test/`.

## Project layout (source)

| Path | Role |
|------|------|
| `src/index.ts` | Fetch entry, wraps responses with security headers, catches errors |
| `src/router.ts` | Routes APIs and downloads; falls through `null` for static files |
| `src/crypto/` | PEM parsing, Web Crypto imports, license-server XML signing |
| `src/license/` | Ticket XML, activation JSON signing, JRebel handlers |
| `src/http/` | `headers.ts`, `cors.ts` |
| `src/validation/` | Expiry and activation field limits |
| `src/data/` | `product.json`, `plugin.json`, `catalog.ts` |

## Static assets

Place UI and binaries under **`public/`**. `wrangler.jsonc` binds this directory as **`assets.directory`**.

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- Chinese: [../zh-CN/DEVELOPMENT.md](../zh-CN/DEVELOPMENT.md)
