<p align="center">
  <strong>jetbrains-license-server-help-cloudflare</strong>
</p>

<p align="center">
  <a href="https://developers.cloudflare.com/workers/">Cloudflare Workers</a> ·
  <a href="#english">English</a> ·
  <a href="#中文">中文</a> ·
  <a href="./docs/README.md"><strong>Docs</strong></a> (<a href="./docs/en-US/">EN</a> / <a href="./docs/zh-CN/">ZH</a>)
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="Node.js >= 20" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-EPL--2.0-blue" alt="License EPL-2.0" />
</p>

---

<h2 id="english">English</h2>

### Overview

This repository ports **[Jetbrains-LicenseServer-Help](https://github.com/Blduu/Jetbrains-LicenseServer-Help)** (Spring Boot / Java) to **one Cloudflare Worker** with **static assets**: same-origin web UI plus XML-RPC license server, activation codes, JRebel-style JSON endpoints, and ja-netfilter download. Ideal for **Git-connected deploys** on Cloudflare without running a JVM.

### Features

- **JetBrains license server protocol** — `GET`/`POST` compatible `/rpc/*.action` responses (signed XML).
- **Activation codes** — REST endpoints aligned with the original Java app (`/license-code/generate`, `/api/generateLicense`, etc.).
- **JRebel-style API** — `/jrebel/*`, `/agent/*`, `/guid` as in upstream.
- **Static SPA** — Vue 3 UI from `public/` via `env.ASSETS`.
- **Ops-friendly** — `/api/health`, security headers, CORS on public read APIs, validation on activation inputs.

### Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | Cloudflare Workers |
| Language | TypeScript |
| Config / CLI | Wrangler 4.x (`wrangler.jsonc`) |
| Static files | Workers Static Assets (`public/`) |
| Data | Bundled `src/data/product.json`, `plugin.json` |
| Crypto | Web Crypto API (RSA-SHA1 / SHA512) keys embedded at build (`src/generated/pem.ts`) |

### Requirements

- **Node.js** ≥ 20  
- **Committed** `src/generated/pem.ts` (so CI / Git builds need no `private/certs/` checkout)  
- **Committed** `public/ja-netfilter.zip` for download route

### Quick start (local)

```bash
git clone https://github.com/Blduu/jetbrains-license-server-help-cloudflare.git
cd jetbrains-license-server-help-cloudflare
npm ci
# If pem.ts is missing: copy keys into private/certs/ then:
npm run embed-pem
npm run dev
```

Open the URL Wrangler prints (e.g. `http://127.0.0.1:8787`).

### Deploy

| Path | Description |
|------|-------------|
| **Cloudflare Dashboard (recommended)** | [Workers Builds — Import a repository](https://developers.cloudflare.com/workers/ci-cd/builds/). Build: `npm ci && npm run build`. Deploy: `npx wrangler deploy`. **No GitHub Secrets** required. |
| **GitHub Actions** | Optional — workflow always **builds + tests**; **deploy** runs only if both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set under **Settings → Secrets and variables → Actions**. See [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) and [docs/en-US/DEPLOY.md](./docs/en-US/DEPLOY.md#optional-github-actions). |

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Blduu/jetbrains-license-server-help-cloudflare)

**Project name vs GitHub:** With this repository, the GitHub name matches `wrangler.jsonc` → `name` (`jetbrains-license-server-help-cloudflare`), so Cloudflare’s default **项目名称** usually needs no edit. If you **fork** under another name, set the dashboard Worker name to match `wrangler.jsonc` — see [**docs/en-US/DEPLOY.md**](./docs/en-US/DEPLOY.md) / [**docs/zh-CN/DEPLOY.md**](./docs/zh-CN/DEPLOY.md).

Full steps (EN): [**docs/en-US/DEPLOY.md**](./docs/en-US/DEPLOY.md)  
Chinese: [**docs/zh-CN/DEPLOY.md**](./docs/zh-CN/DEPLOY.md)  
Short redirect: [**DEPLOY.md**](./DEPLOY.md)

### Repository layout

```
jetbrains-license-server-help-cloudflare/
├── public/              # Static UI, images, ja-netfilter.zip, _headers
├── src/
│   ├── index.ts         # Worker entry + error boundary
│   ├── router.ts        # HTTP routing
│   ├── crypto/          # PEM, signing, license-server XML signatures
│   ├── license/         # Activation XML, JRebel, code generation
│   ├── http/            # Security headers, CORS
│   ├── validation/      # Expiry & field limits
│   ├── data/            # product.json, plugin.json (+ catalog)
│   └── generated/       # pem.ts (committed; rebuilt by scripts/embed-pem.mjs)
├── scripts/embed-pem.mjs
├── test/                # Vitest
├── docs/en-US/          # English docs
├── docs/zh-CN/          # Chinese docs
├── wrangler.jsonc
└── package.json
```

### API (summary)

Detailed reference: [**docs/en-US/API.md**](./docs/en-US/API.md) · [**docs/zh-CN/API.md**](./docs/zh-CN/API.md)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health JSON (`HEAD` supported) |
| GET/HEAD | `/api/products`, `/api/plugins` | Catalog JSON (cached 600s) |
| GET | `/ja-netfilter` | ZIP attachment |
| GET | `/api/generateLicense`, `/api/generatePluginLicense` | Activation string |
| GET/POST | `/license-code/generate` | Activation string |
| * | `/rpc/*.action` | JetBrains license server XML |
| * | `/jrebel/*`, `/agent/*`, `/guid` | JRebel-compatible JSON/HTML |

### npm scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | `embed-pem` + `wrangler dev` |
| `npm run deploy` | `embed-pem` + `wrangler deploy` |
| `npm run build` | `embed-pem` + `tsc --noEmit` |
| `npm run check` | Typecheck only |
| `npm run test` | Embed + Vitest |
| `npm run test:ci` | Vitest only (after build in CI) |
| `npm run embed-pem` | Regenerate `src/generated/pem.ts` from `private/certs/` |

### Documentation index

| Topic | English | 中文 |
|--------|---------|------|
| Deploy | [docs/en-US/DEPLOY.md](./docs/en-US/DEPLOY.md) | [docs/zh-CN/DEPLOY.md](./docs/zh-CN/DEPLOY.md) |
| API | [docs/en-US/API.md](./docs/en-US/API.md) | [docs/zh-CN/API.md](./docs/zh-CN/API.md) |
| Development | [docs/en-US/DEVELOPMENT.md](./docs/en-US/DEVELOPMENT.md) | [docs/zh-CN/DEVELOPMENT.md](./docs/zh-CN/DEVELOPMENT.md) |
| Architecture | [docs/en-US/ARCHITECTURE.md](./docs/en-US/ARCHITECTURE.md) | [docs/zh-CN/ARCHITECTURE.md](./docs/zh-CN/ARCHITECTURE.md) |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) (EN + ZH) |
| Security | [SECURITY.md](./SECURITY.md) (EN + ZH) |

### Security & compliance

- Baseline headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` (see `src/http/headers.ts`, `public/_headers`).
- PEM material is **embedded at build time**; treat the repo like the upstream project regarding key handling and legal use of JetBrains products.

### License

[Eclipse Public License 2.0](./LICENSE) (same family as many JetBrains OSS components — verify compatibility for your use case).

---

<h2 id="中文">中文</h2>

### 概述

本仓库将原 **Jetbrains-LicenseServer-Help**（Spring Boot / Java）迁移为 **单个 Cloudflare Worker + 静态资源**：浏览器与 IDE 使用**同一域名**访问 Web 界面、许可证 XML-RPC、激活码接口、类 JRebel 接口及 ja-netfilter 下载，适合用 **Cloudflare 控制台连接 GitHub** 做持续部署，无需维护 JVM。

### 功能概览

- **JetBrains 许可证服务协议** — `/rpc/*.action`（XML + RSA 签名）。
- **激活码生成** — 与 Java 版路径对齐的 REST 接口。
- **JRebel 相关** — `/jrebel/*`、`/agent/*`、`/guid`。
- **前端** — `public/` 下 Vue 3 静态页，经 `env.ASSETS` 提供。
- **运维** — `/api/health`、安全响应头、只读 API 的 CORS、激活参数校验。

### 本地运行

```bash
git clone https://github.com/Blduu/jetbrains-license-server-help-cloudflare.git
cd jetbrains-license-server-help-cloudflare
npm ci
# 若缺少 pem.ts：将证书放入 private/certs/ 后执行
npm run embed-pem
npm run dev
```

浏览器打开终端输出的本地地址即可。

### 部署方式

1. **推荐**：Cloudflare 控制台 [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) → **创建** → **从存储库导入**，构建命令 `npm ci && npm run build`，部署命令 `npx wrangler deploy`；**不必**在 GitHub 配置 Cloudflare Token。  
2. **可选**：GitHub Actions — 未配置 Secret 时仍会 **构建与测试**，仅跳过发布；需 **Settings → Secrets and variables → Actions** 中同时设置 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 才会执行部署。见 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml) 与 [docs/zh-CN/DEPLOY.md](./docs/zh-CN/DEPLOY.md) 中「可选：GitHub Actions」一节。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Blduu/jetbrains-license-server-help-cloudflare)

**项目名称：** 本仓库 GitHub 名已与 `wrangler.jsonc` 的 `name`（`jetbrains-license-server-help-cloudflare`）一致，导入时一般无需再改。若 **fork** 后仓库名不同，请在 Cloudflare 将 Worker 名称改为与 `wrangler.jsonc` 一致，详见 [**docs/zh-CN/DEPLOY.md**](./docs/zh-CN/DEPLOY.md)。

逐步说明请读 [**docs/zh-CN/DEPLOY.md**](./docs/zh-CN/DEPLOY.md)；英文见 [**docs/en-US/DEPLOY.md**](./docs/en-US/DEPLOY.md)。

### 文档导航

| 主题 | 英文 | 中文 |
|------|------|------|
| 部署 | [docs/en-US/DEPLOY.md](./docs/en-US/DEPLOY.md) | [docs/zh-CN/DEPLOY.md](./docs/zh-CN/DEPLOY.md) |
| 接口 | [docs/en-US/API.md](./docs/en-US/API.md) | [docs/zh-CN/API.md](./docs/zh-CN/API.md) |
| 开发 | [docs/en-US/DEVELOPMENT.md](./docs/en-US/DEVELOPMENT.md) | [docs/zh-CN/DEVELOPMENT.md](./docs/zh-CN/DEVELOPMENT.md) |
| 架构 | [docs/en-US/ARCHITECTURE.md](./docs/en-US/ARCHITECTURE.md) | [docs/zh-CN/ARCHITECTURE.md](./docs/zh-CN/ARCHITECTURE.md) |
| 安全说明 | [SECURITY.md](./SECURITY.md) | 同上 |

### 参与贡献与安全

- [CONTRIBUTING.md](./CONTRIBUTING.md)（中英）  
- [SECURITY.md](./SECURITY.md)（安全联系说明 / 中英）

### 许可证

见仓库根目录 [LICENSE](./LICENSE)（EPL-2.0）。
