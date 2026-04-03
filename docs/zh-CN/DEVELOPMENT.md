# 开发说明

## 环境要求

- **Node.js** ≥ 20（与 `.nvmrc` 保持一致便于 CI）
- **npm** 9+

## 安装

```bash
npm ci
```

## PEM 嵌入（`src/generated/pem.ts`）

Worker 从 **`src/generated/pem.ts`** 读取 RSA 材料，该文件由 `scripts/embed-pem.mjs` 根据 **`private/certs/`** 下文件生成：

- `private.key`
- `public.key`（脚本一并写入；签名为私钥）
- `code-ca.crt`
- `server-child-ca.crt`

若 **`private/certs/`** 不存在，脚本在已有 **`src/generated/pem.ts`** 时会**保留**该文件并正常退出；若两者都不存在则**失败**（因此 CI/克隆仓库须**提交** `pem.ts`）。

证书轮换：从 Java 构建输出 `target/classes/external/certificate/` 复制上述文件到 `private/certs/` 后执行：

```bash
npm run embed-pem
```

**`private/certs/` 已加入 `.gitignore`**；**请将更新后的 `src/generated/pem.ts` 提交到仓库**，以便「一键部署」无需本地密钥目录。

## npm 脚本

| 命令 | 作用 |
|------|------|
| `npm run dev` | 嵌入 PEM + `wrangler dev` |
| `npm run build` | 嵌入 + TypeScript 检查 |
| `npm run check` | 仅 `tsc --noEmit` |
| `npm run deploy` | 嵌入 + `wrangler deploy` |
| `npm run test` | 嵌入 + Vitest |
| `npm run test:ci` | 仅 Vitest（CI 中在 `build` 之后运行） |

## 测试

```bash
npm run test
```

测试位于 `test/`，在 Node 环境下由 Vitest 执行。

## 源码结构

| 路径 | 职责 |
|------|------|
| `src/index.ts` | 入口；统一安全头；全局 try/catch |
| `src/router.ts` | 路由；返回 `null` 则走静态资源 |
| `src/crypto/` | PEM、Web Crypto、XML 签名 |
| `src/license/` | 票据 XML、激活码、JRebel |
| `src/http/` | 安全头、CORS |
| `src/validation/` | 日期与字段校验 |
| `src/data/` | `product.json`、`plugin.json`、`catalog.ts` |

## 静态资源

前端与二进制放在 **`public/`**；`wrangler.jsonc` 中 `assets.directory` 指向该目录。

## 相关

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- 英文版：[../en-US/DEVELOPMENT.md](../en-US/DEVELOPMENT.md)
