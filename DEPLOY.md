# Deploy / 部署

This file is a **shortcut index**. Full guides:

- **English:** [docs/en-US/DEPLOY.md](./docs/en-US/DEPLOY.md)
- **中文:** [docs/zh-CN/DEPLOY.md](./docs/zh-CN/DEPLOY.md)

### One-liner（摘要）

| | |
|---|---|
| **Build** | `npm ci && npm run build` |
| **Deploy** | `npx wrangler deploy` |
| **CF path** | Dashboard → Workers & Pages → Create → **Import a repository** |

Worker / **项目名称** must match `"name"` in [`wrangler.jsonc`](./wrangler.jsonc) (`jetbrains-license-server-help-cloudflare`).  
Canonical repo: [github.com/Blduu/jetbrains-license-server-help-cloudflare](https://github.com/Blduu/jetbrains-license-server-help-cloudflare) — GitHub name matches Wrangler; forks may need a manual name tweak. See [docs/zh-CN/DEPLOY.md](./docs/zh-CN/DEPLOY.md) / [docs/en-US/DEPLOY.md](./docs/en-US/DEPLOY.md).
