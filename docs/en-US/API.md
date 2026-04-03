# HTTP API reference

Unless noted, responses include baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`). Static files may also use rules from `public/_headers`.

## Conventions

- **Base URL**: your Worker URL (e.g. `https://<worker>.workers.dev`).
- **Errors**: Activation endpoints often return **`400`** with **`text/plain`** reason tokens (e.g. `expiry_date_format`). Wrong HTTP method on restricted routes returns **`405`** JSON `{ "error": "method_not_allowed", "allow": [...] }`.

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| `GET`, `HEAD` | `/api/health` | JSON: `{ "ok": true, "service": "jetbrains-license-server-help-cloudflare" }`. `Cache-Control: no-store`. |

**CORS**: `Access-Control-Allow-Origin: *` — supports `OPTIONS` preflight.

---

## Catalog

| Method | Path | Description |
|--------|------|-------------|
| `GET`, `HEAD` | `/api/products` | JSON array from `src/data/product.json`. `Cache-Control: public, max-age=600`. |
| `GET`, `HEAD` | `/api/plugins` | JSON array from `src/data/plugin.json`. Same caching. |

**CORS**: same as health (read-only public APIs).

---

## Downloads

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/ja-netfilter` | Binary ZIP (`Content-Disposition: attachment; filename="ja-netfilter.zip"`). |
| `GET` | `/api/downloadAgent` | **302** redirect to `/ja-netfilter`. |

---

## Activation code (plain text body)

All of the following return a **single activation string** (`text/plain`) on success.

Common **validation** (failure → `400` text/plain):

- `expiryDate`: required, format **`yyyy-MM-dd`**, valid calendar date (UTC).
- `licenseeName` / `assigneeName` (or JSON `licenseName`): max **2048** chars each.
- `productCode` (comma-separated list): total length max **8192** when present.
- `pluginId` (plugin route): max **64** chars.

### `GET /api/generateLicense`

| Query | Required | Description |
|-------|----------|-------------|
| `licenseeName` | no* | License holder |
| `assigneeName` | no* | Assignee |
| `expiryDate` | yes | `yyyy-MM-dd` |
| `productCode` | no | Comma-separated codes; omit = all bundled products + plugins |

\*Empty strings are allowed if within length limits.

### `GET /api/generatePluginLicense`

| Query | Required | Description |
|-------|----------|-------------|
| `pluginId` | yes | Matches `plugin.json` `id` (string compare) |
| `licenseeName`, `assigneeName`, `expiryDate` | see above | |

Product code is resolved from the plugin list, or `PLUGIN_<pluginId>` if unknown.

### `GET /license-code/generate`

Same semantics as `/api/generateLicense` but query uses `licenseeName` / `assigneeName` aligned with the original Spring controller.

### `POST /license-code/generate`

`Content-Type: application/json`, body optional fields:

```json
{
  "licenseName": "",
  "assigneeName": "",
  "expiryDate": "2099-12-31",
  "productCode": "II,PS"
}
```

Max body size **65536** bytes; larger → **413** `payload_too_large`. Invalid JSON → **400** `Invalid JSON`.

---

## JetBrains license server (XML)

| Path | Methods | Response |
|------|---------|----------|
| `/rpc/obtainTicket.action` | GET, POST (form) | `text/xml; charset=UTF-8`, signed |
| `/rpc/ping.action` | GET, POST | same |
| `/rpc/prolongTicket.action` | GET, POST | same |
| `/rpc/releaseTicket.action` | GET, POST | same |

Form/query parameters are merged (e.g. `hostName`, `machineId`, `salt`). Typical client: JetBrains IDE license server URL pointing at this Worker’s origin.

---

## JRebel-compatible

| Path | Description |
|------|-------------|
| `GET /guid` | Plain text UUID |
| `GET`/`POST` + form | `/jrebel/leases`, `/agent/leases` — JSON lease |
| `GET`/`POST` + form | `/jrebel/leases/1`, `/agent/leases/1` — JSON |
| `GET`/`POST` | `/jrebel/validate-connection` — JSON validation stub |

---

## Static UI

Any path not handled by the Worker falls through to **`env.ASSETS`** (files under `public/`), e.g. `/`, `/index.html`, `/css/*`, `/js/*`, `/images/*`.

---

## Related

- Chinese: [../zh-CN/API.md](../zh-CN/API.md)
