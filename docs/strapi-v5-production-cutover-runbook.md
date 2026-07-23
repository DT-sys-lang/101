# Strapi v5 生产切换运行手册

日期：2026-07-12
分支：`upgrade/strapi-v5`
当前结论：**Conditional Go。** locale 冲突和生产等价隔离复演已通过；尚未获得执行生产切换的批准，且 PostgreSQL 超级用户备份与生产基础设施门禁必须先完成。

## 1. 适用范围与不可触碰边界

- 本手册用于准备和演练 Strapi `4.25.20 -> 4.26.2 -> 5.50.1` 的正式切换，不授权直接切流。
- 不得对 `industrial_cms` 执行迁移、恢复、清空、重置或原地升级。
- v5 必须连接由切换前备份恢复出的全新数据库；不得覆盖 `industrial_cms_v5_trial` 或任何既有演练库。
- 未收到明确的“执行生产切换”指令前，不得修改正式 DNS、正式环境变量、正式数据库、反向代理上游或停止 v4。
- 所有 Strapi 构建、升级、迁移和验证必须使用 Node `20.20.2`：

```powershell
$node20 = 'C:\Users\51352263344\nodejs\node-v20.20.2-win-x64\node.exe'
& $node20 --version
# Required: v20.20.2
```

## 2. 已完成的本地生产等价复演

有效演练库和服务：

```text
Database: industrial_cms_v5_locale_phase3_20260712_rehearsal6
PostgreSQL: 127.0.0.1:55432
v5 admin: http://127.0.0.1:1340/admin
Node: 20.20.2
Upgrade: 4.25.20 -> 4.26.2 -> 5.50.1
```

演练从既有 v4 custom dump 恢复到一个此前不存在的隔离数据库，先启动恢复的 v4 和 4.26.2，再升级到 v5；`locale -> contentLocale` 在 v5 首次接触数据库之前完成。数据库、API 和官网证据位于：

- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-phase3-rehearsal.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-phase3-equivalence.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-api-security.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-phase3-v5-website.json`

- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-continuation-equivalence.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-continuation-api-security.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-continuation-encryption-final-v5-website.json`
- `tmp/strapi-v5-locale/continuation-desktop-home.png`
- `tmp/strapi-v5-locale/continuation-desktop-products.png`
- `tmp/strapi-v5-locale/continuation-desktop-resources.png`
- `tmp/strapi-v5-locale/continuation-mobile-home.png`
- `tmp/strapi-v5-locale/continuation-mobile-products.png`

Continuation evidence: isolated Strapi v5 `admin.secrets.encryptionKey` was injected from `ENCRYPTION_KEY`; the local secret was not written to reports or documentation. Equivalence, 8 API/CORS/authentication checks, and 13 website full-chain checks passed. The temporary read-only API token was created, used, revoked, and then returned HTTP 401.

业务对账结果：

| 数据集 | v4 稳定记录 / 已发布 | v5 稳定记录 / 已发布 | 结果 |
| --- | ---: | ---: | --- |
| 产品 `product_facts` | 10 / 10 | 10 / 10 | 通过 |
| 分类 `category_facts` | 8 / 8 | 8 / 8 | 通过 |
| 文章 `blog_posts` | 3 / 2 | 3 / 2 | 通过 |
| 案例 `case_studies` | 2 / 1 | 2 / 1 | 通过 |
| 文档资产 `document_assets` | 20 / 20 | 20 / 20 | 通过 |
| 产品手册 `product_manuals` | 6 / 5 | 6 / 5 | 通过 |
| 意图短语 `intent_phrases` | 4 / 4 | 4 / 4 | 通过 |

`contentLocale` 映射保持原值：`document_assets` 为 `NULL` 15、`multi` 5；`product_manuals` 为 `multi` 6；`intent_phrases` 为 `en` 2、`zh` 2。三个非本地化模型的 v5 系统 `locale` 均为 `NULL`。26 个关系签名族及文档资产媒体引用计数与 v4 相同。

## 3. PostgreSQL 超级用户级切换前备份

### 3.1 现有备份审计

既有备份目录：

```text
D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211
```

该目录包含 v4 `industrial_cms` 的 custom dump、plain SQL dump、source snapshot 和 dump TOC；custom dump 有表定义和 104 份表数据。它**不包含可恢复的全局对象**：

- `postgres_globals.sql` 仅 229 bytes。
- 没有 `CREATE ROLE`、角色成员关系或 `CREATE TABLESPACE` 语句。
- custom dump TOC 中没有 ACL 或 extension 条目。
- 备份说明已记录：`strapi` 应用角色无法读取 `pg_authid`。

因此现有备份可作为应用数据恢复/升级演练输入，但不能作为临近生产切换的完整集群恢复点。

### 3.2 超级用户责任与安全前置条件

数据库负责人必须提供 PostgreSQL 超级用户的受控访问，且只通过 secret manager、部署身份或受保护的 `PGPASSFILE` 使用。不得在命令行、文档、聊天、日志或 `.env` 中写入密码。

普通 `strapi` 数据库角色不能完整导出以下对象：

- 登录角色、非登录角色和角色属性。
- 角色密码 hash、角色成员关系和全局权限。
- tablespace 及其路径。
- 依赖上述角色的 ownership/restore 前置条件。

执行人：**DBA / 基础设施负责人**。未完成本节即为生产切流阻断项。

### 3.3 创建临近切换备份

`strapi-cms/scripts/create-production-cutover-backup.ps1` 会：

1. 明确要求 `-AllowProductionDatabase` 才允许目标是 `industrial_cms`。
2. 验证登录角色为 PostgreSQL 超级用户。
3. 以时间戳创建新目录，拒绝覆盖任何既有备份。
4. 创建 custom dump、plain dump、`pg_dumpall --globals-only`、extension manifest、TOC、SHA-256、global-object audit 与恢复说明。
5. 拒绝没有 `CREATE ROLE` 的 globals dump，并按当前 tablespace 数量检查 `CREATE TABLESPACE` 语句。

DBA 在受保护会话中执行：

```powershell
$env:PGPASSFILE = '<secret-manager-provided-pgpass-file>'
.\strapi-cms\scripts\create-production-cutover-backup.ps1 `
  -Database industrial_cms `
  -Superuser <postgres-superuser> `
  -HostName <production-postgres-host> `
  -Port <production-postgres-port> `
  -AllowProductionDatabase
```

输出目录必须保留以下文件，并作为受控敏感备份保存：

```text
industrial_cms.dump
industrial_cms.sql
postgres-globals.sql
global-objects-audit.json
industrial_cms.dump.list
extensions.json
SHA256SUMS.txt
backup-manifest.json
RESTORE.md
```

`postgres-globals.sql` 可能包含角色密码 hash，不能附加到工单或上传到非受控位置。

### 3.4 备份验收清单

| 检查 | 通过条件 | 负责人 | 状态 |
| --- | --- | --- | --- |
| 超级用户 preflight | `superuserVerified: true` | DBA | 待外部执行 |
| custom dump | `pg_restore -l` 成功，包含 schema/table/table-data TOC | DBA | 待外部执行 |
| globals | `global-objects-audit.json` 的 `createRoleStatements >= 1`，tablespace 计数符合 preflight | DBA | 待外部执行 |
| 扩展 | `extensions.json` 与目标集群兼容 | DBA | 待外部执行 |
| 校验和 | 所有 `SHA256SUMS.txt` 项与 SHA-256 一致 | DBA | 待外部执行 |
| 备份隔离 | 新时间戳目录、加密存储、访问最小化、保留策略已登记 | DBA / 发布负责人 | 待外部执行 |

### 3.5 恢复到新验证库

恢复前必须验证 SHA-256。切勿恢复进 `industrial_cms`：

```powershell
$backupDirectory = '<protected-backup-directory>'
$targetDatabase = 'industrial_cms_v5_restore_validation_YYYYMMDD_HHMMSS'
if ($targetDatabase -eq 'industrial_cms') { throw 'Refusing to restore over industrial_cms.' }

Get-Content -LiteralPath (Join-Path $backupDirectory 'SHA256SUMS.txt') | ForEach-Object {
  if ($_ -notmatch '^(?<hash>[0-9a-f]{64}) \*(?<file>.+)$') { throw "Invalid SHA256SUMS entry: $_" }
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $backupDirectory $matches.file)).Hash.ToLowerInvariant()
  if ($actual -ne $matches.hash) { throw "Checksum mismatch for $($matches.file)" }
}
```

全新替代 PostgreSQL 集群的恢复顺序：

```powershell
$env:PGPASSFILE = '<secret-manager-provided-pgpass-file>'
& '<pg-bin>\psql.exe' -X -w -h <host> -p <port> -U <superuser> -d postgres `
  -v ON_ERROR_STOP=1 -f (Join-Path $backupDirectory 'postgres-globals.sql')
& '<pg-bin>\createdb.exe' -w -h <host> -p <port> -U <superuser> -O <application-owner> $targetDatabase
& '<pg-bin>\pg_restore.exe' -w -h <host> -p <port> -U <superuser> -d $targetDatabase `
  --exit-on-error --verbose (Join-Path $backupDirectory 'industrial_cms.dump')
```

同一现有 PostgreSQL 集群的演练不得重新导入 globals；DBA 先审阅角色、成员关系、tablespace、owner 和 extension 版本是否已满足，再创建一个唯一的新验证库，仅恢复 custom dump。

## 4. 新库完整复演流程

切换日前必须用第 3 节生成的最新备份，在一个此前不存在且可删除的新库上重跑。数据库名称必须匹配 `industrial_cms_v5_locale_phase3_<timestamp>`，且不得是 `industrial_cms`、`industrial_cms_v5_trial` 或任何已有演练库。

```powershell
.\strapi-cms\scripts\invoke-phase3-production-equivalent-rehearsal.ps1 `
  -Database industrial_cms_v5_locale_phase3_<new_timestamp> `
  -Backup '<latest-protected-backup>\industrial_cms.dump' `
  -HostName <isolated-postgres-host> `
  -Port <isolated-postgres-port> `
  -StrapiPort <new-v5-port> `
  -V4StrapiPort <new-v4-port> `
  -V426StrapiPort <new-426-port>
```

该脚本先验证目标库名称和端口，再从 dump 恢复、启动 v4 `4.25.20`、升级并启动 v4 `4.26.2`、执行 `locale -> contentLocale`、启动 v5 `5.50.1`，最后运行数据等价 verifier。失败时保留新演练库以便诊断，不覆盖任何已存在库。

v5 启动前必须保持以下顺序：

```powershell
Push-Location .\strapi-cms
& $node20 .\node_modules\@strapi\strapi\bin\strapi.js build
& $node20 .\scripts\copy-strapi-json.mjs
Pop-Location
```

然后运行：

```powershell
& $node20 .\strapi-cms\scripts\verify-phase3-production-equivalence.mjs `
  --target-database industrial_cms_v5_locale_phase3_<new_timestamp> `
  --target-port <isolated-postgres-port>

& $node20 .\strapi-cms\scripts\verify-phase3-api-security.mjs `
  --v4-base-url <isolated-v4-url> `
  --v5-base-url <isolated-v5-url>

& $node20 .\strapi-cms\scripts\verify-phase3-v5-website.mjs `
  --target-database industrial_cms_v5_locale_phase3_<new_timestamp> `
  --target-port <isolated-postgres-port> `
  --strapi-base-url <isolated-v5-url> `
  --website-port <isolated-next-port>
```

验收必须覆盖产品、分类、文章、案例、文档资产、手册、意图短语的稳定记录数、发布状态、`contentLocale`、关系签名、媒体引用和 REST/API 输出。

## 5. 生产配置与外部集成门禁

### 5.1 管理账户、RBAC 与 API Token

| 项目 | 当前状态 | 切换前验证方式 | 上线条件 |
| --- | --- | --- | --- |
| Strapi 管理员 | 待外部配置 | DBA/CMS 负责人列出管理员、SAML/本地账号、MFA、禁用离职账号和恢复流程；登录逐角色验证 | 最小人数、最小权限、MFA 与审计责任明确 |
| 管理角色 | 待外部配置 | 导出每个 admin role 的 collection type、plugin 和 settings 权限；编辑、发布、删除、Token 管理分离 | 无共享管理员、无不必要 super admin |
| facts token | 本地隔离已验证 | 已轮换 token 在 `/internal/cms/facts` 返回 200；旧 token 立即返回 401/403 | 仅 Next server 持有，进入 secret manager |
| resources API token | 隔离临时 read-only token 已验证 | 验证只读 scope；非法 filter/populate 不能变为 500；撤销后返回 401 | 生产 token 最小 scope、到期日、轮换和撤销演练完成 |
| 部署 secrets | 待外部配置 | secret manager 注入并检查日志/构建产物没有泄露 | `APP_KEYS`、JWT、admin、API salt、encryption、DB、facts/resources、preview/webhook 全部独立随机且不入库 |

临时 token 复演证据：在隔离 v5 库创建 read-only token，资源 REST 数据读取成功，撤销后返回 HTTP 401；token 未写入报告或环境文件。

### 5.2 上传、媒体与 CDN

| 项目 | 当前状态 | 切换前验证方式 | 上线条件 |
| --- | --- | --- | --- |
| 上传 provider | 阻断上线 | 当前仅有本地 `public/uploads` 默认目录，未配置对象存储 provider | 明确选择持久卷或对象存储；生产容器临时磁盘不可作为唯一媒体存储 |
| 对象存储 | 待外部配置 | 上传、读取、删除、覆盖保护、私有/公开权限、跨区域/版本备份逐项实测 | 生产 bucket、最小 IAM、生命周期与备份恢复演练完成 |
| CDN URL | 待外部配置 | 验证 Strapi 返回 URL、CDN 缓存、失效、跨域媒体加载和回源权限 | 图片/附件在官网、管理端、移动端均可访问 |
| 媒体备份 | 待外部配置 | 恢复一个媒体样本到新验证库/桶并核对引用 | 数据库和媒体的恢复点时间一致或有明确差异说明 |

### 5.3 CORS、反向代理与限流

| 项目 | 当前状态 | 切换前验证方式 | 上线条件 |
| --- | --- | --- | --- |
| v5 应用 CORS | 隔离已验证 | 白名单 Origin 预检 204；非白名单 Origin 不回显；生产设置只列官网、预览和必要本地地址 | `STRAPI_CORS_ORIGINS` 没有 `*`，并通过正式/预览实际域名验收 |
| 反向代理 TLS | 待外部配置 | `curl -I` 验证 HTTPS、HSTS 策略、Host、`X-Forwarded-Proto/Host/For`、真实 client IP | CMS `PUBLIC_URL` 与外部 HTTPS URL 一致 |
| 请求限制 | 待外部配置 | 上传大小、JSON/body 大小、代理 body 限制、慢请求 timeout、429 限流逐项测量 | 反向代理对 `/admin`、`/internal/cms`、登录和 webhook 有速率限制 |
| 路由分离 | 待外部配置 | 验证 `/admin`、`/internal/cms`、静态媒体、webhook/preview 的 upstream、缓存和访问控制 | `/admin` 不被 CDN 缓存；媒体有明确缓存/失效策略 |
| v4 CORS 遗留 | 风险已记录 | 旧 v4 对非白名单 facts Origin 仍会回显；不得将该行为复制到 v5 | 切流前仅以 v5 CORS 策略对外提供新服务 |

建议 Nginx/Ingress 验证项：TLS 证书链、`proxy_set_header Host $host`、`X-Forwarded-Proto https`、`X-Forwarded-For`、`client_max_body_size`、读写/连接超时、`/uploads` 或 CDN 缓存头、`/admin` 无缓存、`/internal/cms` 不被公开缓存、登录与 webhook 限流。

### 5.4 Webhook 与 Preview

| 项目 | 当前状态 | 切换前验证方式 | 上线条件 |
| --- | --- | --- | --- |
| CMS revalidation webhook 签名 | 代码已具备，部署待验证 | `/api/revalidate/cms` 只接受 `entry.publish`、`entry.update`、`entry.unpublish`；HMAC SHA-256、5 分钟 timestamp skew、元数据白名单、坏签名/过期时间返回 401 | `CMS_REVALIDATE_SECRET` 来自 secret manager，真实 webhook 端到端通过 |
| webhook 重试/告警 | 阻断上线 | 验证 5xx 重试策略、死信/告警、可追踪 request ID、失败通知 | 运维可在 5 分钟内发现并处理失败 |
| webhook 幂等 | 阻断上线 | 同一 delivery ID 或 event ID 重放不重复执行并可审计 | 配置持久去重存储或网关去重；当前代码没有持久幂等记录 |
| 通用 `/api/revalidate` | 代码已禁用 POST，部署待验证 | POST 固定返回 405；仅签名 CMS 路由可作为正式失效来源 | 正式反向代理复测 405，保留 `/api/revalidate/cms` 的签名入口 |
| Preview secret | 代码已具备，产品能力待验收 | `/api/preview/cms` 以 header secret 认证；错误 secret 返回 401 | secret 轮换、访问日志脱敏、有效期与撤销机制完成 |
| Draft preview/noindex | 阻断上线 | 当前路由只解析受认证的规范路径，不是带 Draft Mode 的内容预览 | 正式启用预览前实现草稿数据读取、登录/签名、短期有效链接、`X-Robots-Tag: noindex`/robots 控制并验证不可被索引 |

## 6. API、官网与浏览器回归

本地隔离演练已通过：

- v4 管理端 `http://127.0.0.1:1337/admin`、现有 v5 trial `http://127.0.0.1:1338/admin`、新 v5 演练端 `http://127.0.0.1:1340/admin` 均为 HTTP 200。
- v5 facts：缺 token 403，有正确 token 200；非白名单 CORS Origin 不回显，白名单预检 204。
- v5 REST：缺 token、错误 token、未鉴权畸形 filter/populate 均不返回 500；临时只读 token 的畸形 filter/populate 返回 400。
- v5 资源 REST：2 篇发布文章、1 篇发布案例、5 条发布手册；手册只暴露 `contentLocale` 与 v5 `documentId`，不暴露系统 `locale`。
- Next 独立 v5 验证站保持 `lib/cms -> adapter/domain` 响应边界，`/en`、`/en/products`、`/en/resources`、`/en/resources/blog`、`/sitemap.xml` 均为 HTTP 200，具有 title/description，未检测到 Next 错误页。

切换日前执行：

```powershell
npm run validate:strapi-response
npm run typecheck
npm run lint
$env:NEXT_DIST_DIR = 'tmp/strapi-v5-locale/next-build-cutover'
npm run build
Remove-Item Env:NEXT_DIST_DIR -ErrorAction SilentlyContinue
```

Continuation browser regression passed locally with `agent-browser` on an isolated Node 20 validation server: desktop `1440x1000` covered `/en`, `/en/products`, and `/en/resources`; mobile `390x844` covered `/en`, the expanded navigation, and `/en/products`. Content, images, navigation, and product cards rendered; no error overlay, horizontal overflow, broken loaded images, or console errors were observed. The screenshots are listed in section 2. CI or an acceptance-device browser run remains an external production gate.

Continuation status: local isolated browser regression is complete; CI or acceptance-device evidence remains pending and is still an external production gate.

## Phase 4 production infrastructure and approval package

The phase-4 external-readiness checklist and final approval package are `docs/strapi-v5-production-readiness-checklist.md` and `docs/strapi-v5-final-production-approval-package.md`. They distinguish local rehearsal evidence from real production-equivalent evidence and retain the following blockers: PostgreSQL-superuser globals backup, fresh restore rehearsal, secret-manager/RBAC/MFA evidence, persistent media/CDN, proxy/TLS/rate-limit verification, webhook retry/alerting/durable idempotency, real Draft Preview/noindex, and CI or acceptance-device browser evidence.

`strapi-cms/scripts/collect-phase4-infrastructure-evidence.ps1` performs a default local static audit without network requests or secret reads. It only makes read-only HTTPS requests when a responsible operator explicitly passes `-RunExternalChecks` and approved URLs. Its reports are evidence inputs, never cutover authorization.

## Phase 5 real pre-staging rehearsal status

The phase-5 access audit is recorded in `docs/strapi-v5-phase5-prestaging-access-gate-20260713.md`. No real staging or production-equivalent platform, HTTPS domain, isolated PostgreSQL target, object-storage test bucket, proxy/CDN, CI run, monitoring entry point, administrator acceptance account, or responsible-owner authorization was supplied. Therefore no real deployment, restore, migration, API/security validation, browser acceptance, or external infrastructure probe was executed.

The fresh 2026-07-13 local-only audit is `tmp/strapi-v5-production-evidence/phase5-local-static-audit-20260713/phase4-infrastructure-evidence.json`: `executionMode: local-audit-only`, `externalCheckOverall: not-run`, and `productionCutoverAuthorized: false`. It found no deployment descriptors, no object-storage upload provider, and no CI deployment step. The repository CI workflow defines a standalone Strapi Node `20.20.2` build/schema-copy job, but no CI run URL, immutable artifact reference, or sanitized log for the evaluated revision was supplied; this is not real deployment evidence.

This is a blocking access condition, not a passed rehearsal. `industrial_cms`, v4, DNS, traffic, production credentials, and production infrastructure remain untouched; `productionCutoverAuthorized` remains false.

An earlier development-server log contained `Unexpected end of JSON input`. After deleting only the dedicated transient Next output and restarting with Node 20, the issue did not reproduce: repeated `/en`, `/en/products`, and `/en/resources` requests returned HTTP 200. At verification time, the clean-restart log contained only a Next development LCP advisory for `/images/hero/industrial-instrumentation.png`; it is nonblocking and is not performance-validation evidence.


## 7. 维护窗口、职责与放量

建议维护窗口：**2-4 小时**。建议 v4 观察期：**72 小时**，最低不得少于 **24 小时**。

| 角色 | 责任 |
| --- | --- |
| 发布负责人 | 变更单、门禁签字、冻结/切流/回滚决策、时间线和外部沟通 |
| DBA / 基础设施负责人 | 超级用户备份、全局对象审阅、全新恢复库、数据库权限/扩展、PostgreSQL 监控 |
| CMS 验证负责人 | admin、RBAC、facts/REST、发布状态、媒体、token、内容抽检 |
| 前端验证负责人 | `lib/cms` 边界、网页/API、metadata、sitemap、桌面/移动回归、缓存刷新 |
| 业务验收负责人 | 产品、分类、文章、案例、文档、手册、意图语义、下载与关键业务路径验收 |

### 7.1 建议时间线

1. T-7 至 T-1 天：完成所有外部门禁、演练、owner 签字和回滚联系人值守表。
2. T-24 小时：确认内容冻结窗口、最终变更清单、DBA 的 `PGPASSFILE`/secret manager 可用性、告警通道和 72 小时 v4 保留资源。
3. T-0：冻结 v4 内容编辑和部署；编辑进入可审计冻结队列，禁止 v4/v5 双写。
4. T+0 至 T+30 分钟：DBA 创建最新超级用户级备份，校验 SHA-256，恢复到全新的 v5 切换副本，记录恢复时间与 backup manifest。
5. T+30 至 T+90 分钟：Node 20 构建、复制 Strapi JSON schema、执行升级与 locale 迁移、启动 v5；运行数据库/API/官网验证脚本。
6. T+90 至 T+120 分钟：配置生产 secrets、CORS、上传、代理、限流、监控；仅在预发布或受控 origin 做 health check。
7. T+120 至 T+180 分钟：业务、CMS、前端负责人并行验收；清缓存/失效 CDN；观察 5xx、401/403、p95、媒体 404、DB 连接池和 webhook 失败。
8. T+180 分钟后：所有负责人明确签字且无回滚触发条件时，才由发布负责人授权受控放量/切流。

## 8. 观察期与回滚

### 8.1 观察期规则

- 保留 v4 可运行环境、其配置版本和切换前备份至少 72 小时；最低 24 小时。
- 观察期内禁止 v4 与 v5 并行编辑。内容修改进入冻结队列，只有发布负责人解除冻结后在当前唯一权威 CMS 中录入。
- 不对 v5 数据库做原地降级；不以 v5 数据覆盖 `industrial_cms`。
- 记录每次缓存刷新、token 轮换、媒体修复和人工数据更正；任何 v5 写入都必须可追溯。

### 8.2 回滚触发条件

满足任一项立即暂停放量并由发布负责人评估回滚：

- v5 `/admin` 不可用、登录/角色异常或高权限操作失败。
- facts/REST 的 5xx 或鉴权失败率超过变更前基线并持续 5 分钟。
- 产品、分类、文章、案例、文档、手册、意图出现内容错位、发布状态错误或关联丢失。
- 媒体/下载 404、权限泄露、CDN 回源失败或大量图片不可访问。
- CORS、token、越权、异常 filter/populate、反向代理限流或请求大小行为异常。
- SEO metadata、canonical/hreflang、`/sitemap.xml` 异常或搜索引擎可抓取预览内容。
- Webhook 持续失败、重复执行、无告警或业务验收负责人拒绝验收。

### 8.3 回滚步骤

1. 发布负责人宣布冻结，停止 v5 写入、Webhook 触发和缓存刷新。
2. 反向代理/DNS/流量路由立即切回已保留的 v4 应用与 v4 数据源；不要停止 v4 直到回退健康检查完成。
3. 前端恢复 v4 CMS 配置，`CMS_STRAPI_API_VERSION=4`，并验证 `/en`、`/en/products`、`/en/resources`、`/en/resources/blog`、`/sitemap.xml`。
4. CMS 负责人验证 v4 admin、facts、资源 REST、权限和关键媒体；业务负责人抽检关键内容。
5. DBA 保留 v5 失败副本只读用于取证；不得将其原地降级，也不得恢复覆盖 `industrial_cms`。
6. 若需重新演练，只从切换前完整备份恢复到另一个新建隔离数据库，修复后重跑全部 verifier。
7. 发布负责人记录触发条件、开始/结束时间、影响范围、数据写入状态和下一次复演结论。

## 9. 当前生产门禁矩阵

| 门禁 | 状态 | 责任人 | 解除条件 |
| --- | --- | --- | --- |
| `locale -> contentLocale` 迁移与数据等价 | 通过 | CMS 验证负责人 | 已在全新 phase-3 库完成，切换日前用最新生产备份复演一次 |
| v4 -> 4.26.2 -> v5 链路 | 通过 | 发布负责人 / CMS 验证负责人 | 用最新生产备份重复完成 |
| 临近切换全局对象备份 | 阻断 | DBA | 超级用户运行备份脚本并完成 globals/role/tablespace/checksum 验收 |
| 生产恢复演练 | 待外部执行 | DBA / 发布负责人 | 从最新超级用户备份恢复到全新可删除库并跑完整链路 |
| 管理员、RBAC、API token、secret manager | 待外部配置 | CMS / 基础设施负责人 | 最小权限、MFA、轮换、撤销、审计和泄露响应演练完成 |
| 上传、媒体备份、CDN | 阻断 | 基础设施负责人 | 持久存储方案、读写删、备份恢复、CDN 与权限验证通过 |
| CORS、TLS 反代、限流 | 待外部配置 | 基础设施负责人 | 正式域名端到端、`X-Forwarded-*`、大小/超时/429/缓存验证通过 |
| Webhook 签名、重试、告警、幂等 | 阻断 | 前端 / 基础设施负责人 | 真正 webhook、告警、持久去重和重试验收完成 |
| Draft Preview 鉴权、过期、noindex | 阻断 | 前端 / CMS 负责人 | 实现并验证真实草稿预览与不可索引控制 |
| v5 API/官网/鉴权本地回归 | 通过 | CMS / 前端验证负责人 | 切换日前对生产等价副本重复，保留报告 |
| 桌面/移动浏览器自动化视觉回归 | 本地隔离已通过，真实验收待验证 | 前端验证负责人 | CI 或验收设备的低分辨率截图、DOM、控制台检查通过 |
| 维护窗口、值守、回滚演练 | 待外部配置 | 发布负责人 | 角色、联系人、时间线、观察阈值和回滚授权签字完成 |

**最终结论：Conditional Go。** 可等待用户批准进入维护窗口准备；不得在以上阻断项未解除、且用户未明确授权前执行正式切流。
