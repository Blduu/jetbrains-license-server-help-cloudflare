# Contributing / 贡献指南

[English](#english) · [中文](#中文)

---

## English

### Ways to help

- **Issues** — Bug reports with repro steps, Worker logs, and `wrangler` / dashboard build logs help a lot.
- **Pull requests** — Small, focused changes; match existing TypeScript style and avoid unrelated refactors.
- **Docs** — Corrections and translations welcome under `docs/en-US/` and `docs/zh-CN/`.

### Before you send a PR

1. Run **`npm run build`** and **`npm run test`** locally.
2. If you change HTTP behavior, update **`docs/en-US/API.md`** and **`docs/zh-CN/API.md`**.
3. Do not commit **`private/certs/`**; only commit **`src/generated/pem.ts`** when intentionally rotating keys (with clear commit message).

### License

By contributing, you agree your contributions are licensed under the same terms as [LICENSE](./LICENSE) (EPL-2.0), unless you state otherwise.

---

## 中文

### 参与方式

- **Issue** — 反馈问题时请尽量附带复现步骤、Worker 日志或 Cloudflare 构建日志。
- **Pull Request** — 改动尽量小且聚焦；保持与现有 TypeScript 风格一致，避免无关大改。
- **文档** — 欢迎更正或补充 `docs/en-US/`、`docs/zh-CN/` 下的内容。

### 提交 PR 前

1. 本地执行 **`npm run build`** 与 **`npm run test`**。
2. 若变更 HTTP 行为，请同步更新 **`docs/en-US/API.md`** 与 **`docs/zh-CN/API.md`**。
3. **不要**提交 **`private/certs/`**；若在维护范围内有意轮换密钥，仅提交 **`src/generated/pem.ts`**，并在 commit 信息中说明。

### 许可

除非另有声明，贡献内容将遵循仓库 [LICENSE](./LICENSE)（EPL-2.0）。
