# Deploying on Cloudflare

This project is designed for **[Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)**: connect a GitHub (or GitLab) repository in the dashboard; pushes trigger build and deploy. You do **not** need `CLOUDFLARE_API_TOKEN` in GitHub Secrets for that path, and you do not need `wrangler login` on your laptop for Cloudflare-hosted builds (only one-time Git provider authorization in the dashboard).

## Prerequisites

1. A Git repository containing:
   - **`src/generated/pem.ts`** — embedded key material for RSA signing (see [DEVELOPMENT.md](./DEVELOPMENT.md)).
   - **`public/ja-netfilter.zip`** — otherwise `GET /ja-netfilter` will fail at runtime.
2. A Cloudflare account.

## Recommended: Import repository (Workers)

Do **not** use the “static site only” Pages template. This app is a **Worker + Static Assets** bundle.

1. Open [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
2. **Create application** → **Import a repository** (Get started).
3. Authorize **GitHub** (or GitLab) and select this repo and branch (e.g. `main`).
4. **Build settings** (see [official configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)):

   | Setting | Value |
   |---------|--------|
   | Root directory | `.` or empty (repository root containing `wrangler.jsonc`) |
   | **Build command** | `npm ci && npm run build` |
   | **Deploy command** | `npx wrangler deploy` (default is fine) |

   `npm run build` runs `prebuild` → `embed-pem` (no-op if `private/certs/` is absent but `pem.ts` exists), then `tsc --noEmit`.

5. **Project / Worker name:** Cloudflare usually **prefills the project name from your GitHub repository name**. It does **not** read `wrangler.jsonc` for that field. Per [Workers name requirement](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/#workers-name-requirement), the dashboard name must **exactly match** `wrangler.jsonc` → `"name"` (this repo: **`jetbrains-license-server-help-cloudflare`**), or the build fails.

   **This repository** uses the GitHub name [`jetbrains-license-server-help-cloudflare`](https://github.com/Blduu/jetbrains-license-server-help-cloudflare), so the prefilled name typically matches Wrangler with no manual edit.

   **If your GitHub repo name differs** (e.g. after a fork with another slug, or mixed-case like `My-Worker-Repo`):

   - Manually set **Project name** to **`jetbrains-license-server-help-cloudflare`**, **or**
   - Change `"name"` in `wrangler.jsonc` to match your chosen Worker name and keep the dashboard in sync, **or**
   - Use **[Deploy to Cloudflare](https://developers.cloudflare.com/workers/platform/deploy-buttons/)** and adjust **Worker name** in the wizard.

6. Save and deploy. Do **not** add manual API token env vars for Cloudflare to deploy *into your own account*; Workers Builds uses the integration identity.
7. Use the issued **\*.workers.dev** URL — UI and APIs share the same origin.

### Health checks

Use **`GET /api/health`** or **`HEAD /api/health`** for uptime checks. Response JSON includes `ok` and `service` name; `Cache-Control: no-store`.

### Preview branches

Non-production branches often use `npx wrangler versions upload` for previews instead of promoting to production — see your dashboard build docs.

## Optional: GitHub Actions

If you prefer CI on GitHub:

1. Create a Cloudflare **API token** with **Workers Scripts: Edit** and **Account Settings: Read** (see [Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)).
2. In the repo: **Settings → Secrets and variables → Actions**, add **`CLOUDFLARE_API_TOKEN`** and **`CLOUDFLARE_ACCOUNT_ID`** (both required for `wrangler deploy` in CI).
3. Workflow: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

**Behavior:** Every push runs **Build and test**. The **Deploy to Cloudflare** step always runs, but the script **skips `npm run deploy`** when either secret is unset (GitHub does not allow the `secrets` context in `if:` expressions). If secrets are missing, CI still passes — use [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) in the dashboard instead, or add the secrets to enable Actions deploy.

This is **independent** from dashboard Git integration — choose one deploy path (or use Actions for CI only).

## Rotating PEM / certificates

Copy `private.key`, `public.key`, `code-ca.crt`, `server-child-ca.crt` from the Java build output (`target/classes/external/certificate/`) into `private/certs/` locally, run `npm run embed-pem`, commit the updated **`src/generated/pem.ts`**, and push.

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Worker name mismatch | Align dashboard worker name with `wrangler.jsonc` → `name`, or change config and recommit. |
| Missing `pem.ts` / embed fails | Commit `src/generated/pem.ts` or provide `private/certs/` in CI. |
| `wrangler` not found | Ensure `npm ci` without `--omit=dev` stripping production deps; `wrangler` is in `dependencies`. |
| `/ja-netfilter` 404 | Commit `public/ja-netfilter.zip`. |
| Build OK but 500 at runtime | Check Worker **Logs** in the dashboard; see `src/index.ts` error handler. |
| "All products" fails; **exceededCpu** / **1102**; or **500** `internal_error` | When `productCode` is omitted, the Worker defaults to **IDE codes from `product.json` only** (small enough for Free). To pack **every paid plugin** into one activation code, pass an explicit long `productCode` list and usually **Workers Paid** + higher CPU. `limits.cpu_ms` is **Paid-only** (on Free, Wrangler deploy fails with **100328**). Run `node scripts/check-catalog-weight.mjs` to compare payload sizes. |

## Related

- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- Chinese version: [../zh-CN/DEPLOY.md](../zh-CN/DEPLOY.md)
