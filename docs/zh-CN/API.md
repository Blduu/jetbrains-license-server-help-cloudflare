# HTTP 接口说明

除特别说明外，响应均带基础安全头（`X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`、`Permissions-Policy`）。静态资源另受 `public/_headers` 规则约束。

## 约定

- **基地址**：Worker 部署后的 URL（如 `https://<worker>.workers.dev`）。
- **错误**：激活类接口失败多为 **`400`** + **`text/plain`** 原因码（如 `expiry_date_format`）。在不允许的方法上访问固定路径返回 **`405`** JSON：`{ "error": "method_not_allowed", "allow": [...] }`。

---

## 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET`、`HEAD` | `/api/health` | JSON：`{ "ok": true, "service": "jetbrains-license-server-help-cloudflare" }`，`Cache-Control: no-store`。 |

**CORS**：`Access-Control-Allow-Origin: *`，支持 `OPTIONS` 预检。

---

## 产品 / 插件目录

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET`、`HEAD` | `/api/products` | 来自 `src/data/product.json` 的 JSON 数组，`Cache-Control: public, max-age=600`。 |
| `GET`、`HEAD` | `/api/plugins` | 来自 `src/data/plugin.json`，同上。 |

**CORS**：与健康检查相同（只读公开接口）。

---

## 下载

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/ja-netfilter` | ZIP 附件（`Content-Disposition: attachment`）。 |
| `GET` | `/api/downloadAgent` | **302** 重定向至 `/ja-netfilter`。 |

---

## 激活码（成功时为纯文本）

以下接口成功时响应体为 **单行激活码**（`text/plain`）。

通用 **校验**（失败 → `400` + `text/plain`）：

- `expiryDate`：必填，格式 **`yyyy-MM-dd`**，且为合法公历日期（按 UTC 解析）。
- `licenseeName` / `assigneeName`（或 JSON 的 `licenseName`）：单侧最长 **2048** 字符。
- `productCode`（逗号分隔列表）：存在时总长不超过 **8192**。
- `pluginId`（插件接口）：不超过 **64** 字符。

### `GET /api/generateLicense`

| 查询参数 | 必填 | 说明 |
|----------|------|------|
| `licenseeName` | 否* | 许可证名称 |
| `assigneeName` | 否* | 被授权人 |
| `expiryDate` | 是 | `yyyy-MM-dd` |
| `productCode` | 否 | 逗号分隔产品码；省略则使用打包的全部 IDE+插件码 |

\*在长度限制内允许空字符串。

### `GET /api/generatePluginLicense`

| 查询参数 | 必填 | 说明 |
|----------|------|------|
| `pluginId` | 是 | 与 `plugin.json` 中 `id` 字符串比较 |
| `licenseeName`、`assigneeName`、`expiryDate` | 同上 | |

产品在插件表中解析；若无匹配则使用 `PLUGIN_<pluginId>`。

### `GET /license-code/generate`

语义同 `/api/generateLicense`，查询参数命名与 Spring 版 `LicenseCodeController` 对齐（`licenseeName` / `assigneeName`）。

### `POST /license-code/generate`

`Content-Type: application/json`，示例：

```json
{
  "licenseName": "",
  "assigneeName": "",
  "expiryDate": "2099-12-31",
  "productCode": "II,PS"
}
```

正文最大 **65536** 字节，超出返回 **413** `payload_too_large`；JSON 无法解析返回 **400** `Invalid JSON`。

---

## JetBrains 许可证服务（XML）

| 路径 | 方法 | 响应 |
|------|------|------|
| `/rpc/obtainTicket.action` | GET、POST（表单） | `text/xml`，带 RSA 注释签名 |
| `/rpc/ping.action` | GET、POST | 同上 |
| `/rpc/prolongTicket.action` | GET、POST | 同上 |
| `/rpc/releaseTicket.action` | GET、POST | 同上 |

查询参数与 `application/x-www-form-urlencoded` 正文会合并。客户端通常为 JetBrains IDE 的 License server 地址（指向本 Worker 同源根）。

---

## JRebel 兼容

| 路径 | 说明 |
|------|------|
| `GET /guid` | 纯文本 UUID |
| `GET`/`POST` + 表单 | `/jrebel/leases`、`/agent/leases` |
| `GET`/`POST` + 表单 | `/jrebel/leases/1`、`/agent/leases/1` |
| `GET`/`POST` | `/jrebel/validate-connection` |

---

## 静态前端

未被 Worker 显式匹配的路径交由 **`env.ASSETS`** 处理（`public/` 下文件），如 `/`、`/index.html`、`/css/*`、`/js/*` 等。

---

## 相关

- 英文版：[../en-US/API.md](../en-US/API.md)
