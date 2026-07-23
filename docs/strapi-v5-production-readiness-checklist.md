# Strapi v5 生产就绪与外部验收清单

最近更新：2026-07-13
分支：`upgrade/strapi-v5`
当前结论：**Conditional Go**。本文是第四阶段的证据清单与外部验收包，不授予生产切换权限。

第五阶段状态：未执行真实预发布或生产等价环境演练。工作区和已提供的上下文没有包含受控部署平台、真实 HTTPS 域名、隔离 PostgreSQL、对象存储测试桶、反向代理/CDN、CI run、监控入口或具名负责人授权。详细交接记录见 `docs/strapi-v5-phase5-prestaging-access-gate-20260713.md`。

## 1. 范围与证据规则

本文严格区分三类结果：

| 类别 | 含义 |
| --- | --- |
| 已完成的本地隔离演练 | 仅针对 `industrial_cms_v5_locale_phase3_20260712_rehearsal6`、本地端口和临时令牌的证据。不能等同于生产验证。 |
| 已完成的真实预发布/生产等价验证 | 必须有真实 HTTPS URL、环境标识、执行时间、无敏感信息的报告、负责人和可复核的截图/日志摘要。 |
| 外部门禁 | 需要 DBA、基础设施、CMS、业务或用户提供访问、配置、审批或真实环境证据的项目。没有证据即不是通过。 |

禁止项：不得修改 `industrial_cms`，不得停止 v4 `http://127.0.0.1:1337/admin`，不得变更 DNS、流量、正式数据库、正式密钥或正式反向代理。不得记录密码、Token、Cookie、私钥、完整连接串、`PGPASSFILE` 内容或敏感 `.env` 值。

状态定义：

| 状态 | 含义 |
| --- | --- |
| 通过 | 有当前环境的可复核证据，且负责人确认。 |
| 待验证 | 配置或代码存在，但没有真实预发布/生产等价证据。 |
| 缺失 | 工作区未发现所需配置、部署描述或服务能力；需要建设或负责人确认。 |
| 阻断 | 当前条件明确不能支持上线，或缺少不可替代的授权/证据。 |

## 2. 本地证据基线

以下证据已完成，但只适用于隔离环境：

- v4 -> 4.26.2 -> Strapi v5.50.1 链路、`locale -> contentLocale`、数据/关系/媒体对账通过。
- Node `20.20.2` 下 Strapi 构建、schema copy、API/CORS/认证检查和官网全链路检查通过。
- 续演报告：等价性 `ok: true`、API/CORS/认证 8/8、官网全链路 13/13。
- 桌面 `1440x1000` 与移动 `390x844` 的本地 `agent-browser` 回归通过。
- Strapi `admin.secrets.encryptionKey` 已按安装的 v5.50.1 形状接入 `ENCRYPTION_KEY`；本地密钥未写入报告。

权威来源：

- `docs/strapi-v5-migration-report.md`
- `docs/strapi-v5-production-cutover-runbook.md`
- `docs/strapi-v5-cutover-continuation-20260712.md`

## 3. 当前生产基础设施盘点

本节依据工作区静态审计，不读取任何密钥值，也没有连接生产或预发布环境。

| 项目 | 当前状态 | 已知事实 | 需要的真实证据 / 负责人 |
| --- | --- | --- | --- |
| v5 应用部署目标 | 待验证 | `docs/deployment-readiness-checklist.md` 的目标为 Railway；仓库未发现 `.railway`、`railway.toml`、容器/IaC 或真实服务标识。 | 基础设施负责人提供生产与预发布项目/服务标识、根目录 `strapi-cms`、Node 20 运行时、版本/镜像 digest、最近部署日志。 |
| PostgreSQL | 阻断 | 本地有 v4 `industrial_cms` 和隔离 PostgreSQL；生产主机、版本、HA、备份存储与权限模型未提供。 | DBA 提供非敏感拓扑摘要、版本、owner、扩展、备份位置引用和超级用户备份证据。 |
| 对象存储 / 持久媒体 | 缺失 | `strapi-cms` 未安装 `@strapi/provider-upload-*`；运行手册确认当前仅为本地 `public/uploads` 默认目录。 | 基础设施负责人选择对象存储或持久卷，提供 bucket/container、最小 IAM、版本/生命周期和恢复演练证据。 |
| 域名、HTTPS、证书 | 待验证 | 示例仅含占位 `PUBLIC_URL`；无真实域名、证书或 TLS 配置。 | 基础设施负责人提供生产/预览域名、证书链、有效期、HSTS 策略和 HTTPS 探测报告。 |
| 反向代理 / CDN | 缺失 | 无 Nginx、Ingress、Caddy、CDN 或路由配置文件。 | 基础设施负责人提供生效配置摘要与 `/admin`、`/internal/cms`、媒体、webhook、preview 的路由/缓存证据。 |
| 日志、监控、告警 | 缺失 | 未发现 Sentry、Datadog、Prometheus、OpenTelemetry、Grafana、PagerDuty 或 Opsgenie 的生产集成配置。 | 基础设施负责人提供日志检索位置、5xx/401/403/429、媒体 404、数据库、webhook、证书到期告警及演练通知证据。 |
| 部署密钥管理 | 待验证 | `.env.example` 定义所需键；真实 secret manager、访问策略、轮换及审计未提供。 | 基础设施负责人提供密钥项清单、注入证明、访问最小化、轮换/撤销演练编号；不得提供密钥值。 |
| CI 发布门禁 | 待验证 | GitHub Actions 已定义前端 Node 24 质量/构建 job 和独立的 Strapi Node `20.20.2` build/schema-copy job；尚未提供对应提交的真实 CI run。 | 发布负责人提供同一提交上的 CI run URL/编号及 Strapi Node 20 build 证据。 |
| 备份与异地保留 | 阻断 | 既有 `101-20260712-143211` 备份的 globals 仅 229 bytes，零个 `CREATE ROLE`/`CREATE TABLESPACE`。 | DBA 以超级用户创建新时间戳生产切换备份，校验和、globals audit、受控异地/对象存储引用和恢复演练证据。 |

静态审计报告由以下命令生成，默认不联网：

```powershell
.\strapi-cms\scripts\collect-phase4-infrastructure-evidence.ps1
```

本轮本地审计结果：Strapi `5.50.1`、Node 固定文件 `20`、`ENCRYPTION_KEY` 配置形状和 CORS allowlist 代码存在；对象存储 provider、部署描述和 CI 部署步骤均未在工作区发现。GitHub Actions 已定义独立的 Strapi Node `20.20.2` 构建/schema-copy job，但其真实 CI run 仍待提供和登记。2026-07-13 的新鲜离线审计工件为 `tmp/strapi-v5-production-evidence/phase5-local-static-audit-20260713/phase4-infrastructure-evidence.json`：`executionMode: local-audit-only`、`externalCheckOverall: not-run`、`productionCutoverAuthorized: false`；它不构成真实预发布或生产等价验收。报告写入受忽略目录 `tmp/strapi-v5-production-evidence/<timestamp>/`。

## 4. 真实基础设施只读验证

在基础设施负责人提供真实 HTTPS 地址后，使用下列命令采集不含凭据的 HTTP/CORS/TLS 头部证据。该脚本只有显式指定 `-RunExternalChecks` 时才发送请求；它不会部署、写库、改 DNS、轮换密钥或停止 v4。

Phase 5 note: no real pre-staging or production-equivalent URLs, deployment access, isolated database, test bucket, proxy/CDN, CI run, monitoring entry point, or owner authorization was provided. `-RunExternalChecks` was not used; no real deployment, restore, migration, security check, or browser acceptance was executed. See `docs/strapi-v5-phase5-prestaging-access-gate-20260713.md` for the exact handoff requirements.

```powershell
.\strapi-cms\scripts\collect-phase4-infrastructure-evidence.ps1 `
  -RunExternalChecks `
  -StrapiBaseUrl 'https://<cms-production-equivalent-host>' `
  -FrontendBaseUrl 'https://<frontend-production-equivalent-host>' `
  -AllowedCorsOrigin @('https://<official-site-host>', 'https://<approved-preview-host>')
```

预期探测：

| 探测 | 通过条件 |
| --- | --- |
| Strapi admin HTTPS | `/admin` 为 HTTPS 且 HTTP 200；证书/反代证据另附。 |
| facts 未携带 Bearer | `/internal/cms/facts` 返回 401 或 403，不返回数据。 |
| 已批准 Origin | 对每个列入白名单的 Origin，`OPTIONS` 返回 204，且 `Access-Control-Allow-Origin` 精确等于该 Origin。 |
| 未知 Origin | `OPTIONS` 允许 200 或 204 的框架状态，但**不得**存在 `Access-Control-Allow-Origin` 回显；任何回显为失败。 |
| 前端状态与 sitemap | `/api/cms/status`、`/sitemap.xml` 均为 HTTPS 200。 |
| 通用 revalidate | `POST /api/revalidate` 固定为 405。 |

该脚本不会验证带密钥的正向 facts/REST 请求、管理员登录、对象存储、CDN purge、数据库、webhook 或 preview；这些项目必须按后续章节取得负责人控制下的证据。

## 5. PostgreSQL 超级用户备份与恢复门禁

### 5.1 不可替代的超级用户责任

普通 `strapi` 数据库角色不能替代 PostgreSQL 超级用户全局对象备份。PostgreSQL 官方 `pg_dumpall` 文档说明：数据库角色、tablespace 与配置参数权限等全局对象不由 `pg_dump` 保存；完整导出通常需要数据库超级用户，恢复这些角色/数据库也需要超级用户权限。

当前历史 backup globals 缺少角色和 tablespace 定义，故为上线阻断。没有 PostgreSQL 超级用户受控授权时：**不得尝试提权，不得运行备份脚本指向 `industrial_cms`，不得修改 `industrial_cms`。**

### 5.2 切换前备份命令模板

DBA 仅在受保护会话、通过 secret manager 或受保护 `PGPASSFILE` 注入认证后执行。不要在命令行历史、工单、聊天、日志或 `.env` 写入口令。

```powershell
$env:PGPASSFILE = '<secret-manager-provided-pgpass-file>'
.\strapi-cms\scripts\create-production-cutover-backup.ps1 `
  -Database industrial_cms `
  -Superuser <postgres-superuser> `
  -HostName <production-postgres-host> `
  -Port <production-postgres-port> `
  -AllowProductionDatabase
```

脚本会拒绝非超级用户、拒绝覆盖已有备份、要求 globals 中至少有一个 `CREATE ROLE`，并按 preflight 核对 custom tablespace。输出目录命名规则：

```text
<controlled-backup-root>\industrial_cms-production-cutover-YYYYMMDD-HHMMSS\
```

必需工件：

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

`postgres-globals.sql` 可能含角色密码 hash，必须被视为敏感备份工件；审批包仅登记加密存储位置引用、访问控制组、保留策略编号和 checksum 成功结果，不附文件内容。

### 5.3 哈希、异地保留与恢复验证

DBA 必须在备份完成后和每次恢复前验证 SHA-256：

```powershell
$backupDirectory = '<controlled-backup-directory>'
Get-Content -LiteralPath (Join-Path $backupDirectory 'SHA256SUMS.txt') | ForEach-Object {
  if ($_ -notmatch '^(?<hash>[0-9a-f]{64}) \*(?<file>.+)$') { throw "Invalid SHA256SUMS entry: $_" }
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $backupDirectory $matches.file)).Hash.ToLowerInvariant()
  if ($actual -ne $matches.hash) { throw "Checksum mismatch for $($matches.file)" }
}
```

异地/对象存储验收：

1. 将完整目录加密保存到与主数据库故障域不同的受控位置，启用访问最小化与不可变/版本保留策略。
2. 记录存储位置引用、加密/KMS 或等效控制、保留期、恢复访问负责人和一次独立读取校验结果；不记录 bucket 凭据或对象 URL 中的签名参数。
3. 以 `backup-manifest.json`、`global-objects-audit.json` 和 `SHA256SUMS.txt` 作为审批证据，globals 内容留在受控位置。

恢复验证必须在全新替代集群或唯一的新验证库中进行：

```powershell
$env:PGPASSFILE = '<secret-manager-provided-pgpass-file>'
$backupDirectory = '<controlled-backup-directory>'
$targetDatabase = 'industrial_cms_v5_restore_validation_YYYYMMDD_HHMMSS'
if ($targetDatabase -eq 'industrial_cms') { throw 'Refusing to restore over industrial_cms.' }

# 仅 clean replacement cluster：DBA 审阅 globals 后恢复角色/tablespace。
& '<pg-bin>\psql.exe' -X -w -h <host> -p <port> -U <superuser> -d postgres `
  -v ON_ERROR_STOP=1 -f (Join-Path $backupDirectory 'postgres-globals.sql')
& '<pg-bin>\createdb.exe' -w -h <host> -p <port> -U <superuser> -O <application-owner> $targetDatabase
& '<pg-bin>\pg_restore.exe' -w -h <host> -p <port> -U <superuser> -d $targetDatabase `
  --exit-on-error --verbose (Join-Path $backupDirectory 'industrial_cms.dump')
```

同一已存在 PostgreSQL 集群的验证不得重放 globals；DBA 必须先比对 roles、membership、tablespace、owner 和扩展，再创建唯一新库并恢复 custom dump。之后运行第四阶段前的全链路复演脚本与三类 verifier。

## 6. 服务与安全配置验收

### 6.1 Node、部署和 Strapi 启动

| 项目 | 当前状态 | 真实环境验收条件 |
| --- | --- | --- |
| Node 固定策略 | 待验证 | 运行时、构建日志和 release artifact 均显示 Node `20.20.2`；不得以系统 Node 24 替代 Strapi。 |
| Strapi 构建 | 待验证 | 从干净依赖使用 Node 20 执行 `strapi build`，随后执行 `copy-strapi-json.mjs`，产物中的三个 schema 含 `contentLocale`。 |
| Strapi 启动 | 待验证 | `NODE_ENV=production`、`HOST=0.0.0.0`、平台端口、正确 `PUBLIC_URL`，且 v5 只连接全新恢复副本。 |
| 部署来源 | 待验证 | 提供同一 commit 的 CI run、部署日志、版本/镜像 digest 与回滚到 v4 的部署标识。 |

受控执行模板：

```powershell
$node20 = 'C:\Users\51352263344\nodejs\node-v20.20.2-win-x64\node.exe'
Push-Location .\strapi-cms
& $node20 .\node_modules\@strapi\strapi\bin\strapi.js build
& $node20 .\scripts\copy-strapi-json.mjs
Pop-Location
```

### 6.2 管理员、RBAC、MFA 与 Token

| 项目 | 当前状态 | 外部验收证据 |
| --- | --- | --- |
| 管理员账号 | 待验证 | 管理员清单由 CMS 负责人在受控系统保管；逐账号确认企业身份、MFA/强密码、离职禁用和恢复流程。审批包只记录数量、角色和验收结果。 |
| 管理角色 | 待验证 | 导出每个 admin role 的 collection type、plugin、settings 权限；证明编辑、发布、删除、API token 管理职责分离，且无共享/多余 super admin。 |
| `INTERNAL_CMS_FACTS_TOKEN` | 待验证 | 新 token 在服务端 facts 调用成功，缺失/撤销旧 token 得到 401/403；token 本身不进入报告。 |
| resources API token | 待验证 | 最小 read-only scope、到期日期、轮换与撤销演练；过期/撤销/越权 token 全部得到 401/403，不出现 500。 |
| 部署 secrets | 待验证 | secret manager 注入 `APP_KEYS`、JWT/admin/API salts、`ENCRYPTION_KEY`、数据库、facts/resources、preview/webhook；日志与构建产物扫描无泄露；轮换和泄露处置记录齐全。 |

### 6.3 上传、对象存储、CDN 与媒体

当前状态：**阻断**。工作区没有对象存储 upload provider，当前本地 `public/uploads` 不得作为生产容器唯一媒体存储。

上线前逐项取得真实环境证据：

1. 对象存储/持久卷 provider 已安装并由 secret manager 注入配置。
2. 用非敏感测试媒体验证上传、读取、删除、替换、权限拒绝、跨域加载和回源失败页面。
3. 验证数据库记录、对象版本/生命周期、备份和恢复一致性；恢复到新验证环境后复核 Strapi 引用。
4. 验证 CDN URL、媒体 `Cache-Control`、失效/purge、私有对象签名策略（如适用）和官网/管理端/移动端加载。
5. 将测试对象 ID、HTTP 状态、缓存头、恢复时间和负责人登记为证据；不记录 bucket 访问密钥或签名 URL。

### 6.4 CORS、TLS、反向代理与限流

| 表面 | 当前状态 | 验收条件 |
| --- | --- | --- |
| CORS allowlist | 待验证 | Strapi 代码读取 `STRAPI_CORS_ORIGINS`；真实生产仅列正式官网、批准的预览域和必要管理域，不含 `*`。 |
| 未知 Origin | 待验证 | 对未知 Origin，响应不得回显 `Access-Control-Allow-Origin`；同时 bearer/API 鉴权仍拒绝未授权访问。 |
| HTTPS / TLS | 待验证 | 实际域名为 HTTPS，证书链有效、续期告警存在；记录 HSTS 决策。 |
| 代理头 | 缺失 | `Host`、`X-Forwarded-Proto https`、`X-Forwarded-Host`、`X-Forwarded-For` 和真实 client IP 在实际代理链验证。 |
| 请求约束 | 缺失 | 对上传大小、JSON/body、慢请求、连接/读写 timeout、登录、`/admin`、`/internal/cms` 和 webhook 执行 429/超时测量。 |
| 缓存与错误页 | 缺失 | `/admin` 不被 CDN 缓存；`/internal/cms` 不得公开缓存；媒体按策略缓存；4xx/5xx 不泄露内部异常、token 或堆栈。 |

反向代理/Ingress 配置审阅模板（由基础设施负责人填入实际等效设置，而非将下列模板当作已部署事实）：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
client_max_body_size <approved-upload-limit>;
proxy_connect_timeout <approved-connect-timeout>;
proxy_read_timeout <approved-read-timeout>;
```

### 6.5 Webhook、Preview 与 REST 鉴权

| 项目 | 当前状态 | 结论与外部验收 |
| --- | --- | --- |
| webhook HMAC、事件范围、时间窗 | 待验证 | 代码已实现 HMAC SHA-256、5 分钟 timestamp skew、`entry.publish`/`entry.update`/`entry.unpublish` 和 metadata allowlist；必须在真实环境发送签名测试事件、坏签名、过期事件和未知字段。 |
| webhook 重试、告警、幂等 | 阻断 | 当前代码没有持久 delivery/event 去重记录，也没有已验证的重试/死信/告警链路。必须先提供持久去重与 5 分钟内可发现失败的真实测试证据。 |
| 通用 revalidate | 待验证 | `POST /api/revalidate` 本地为 405；必须经真实反代再测，不能被改写。 |
| Preview 鉴权 | 待验证 | 代码有 secret 校验和规范路由解析；真实部署需验证正确/错误 secret、访问日志脱敏与撤销。 |
| Draft Preview、过期、noindex | 阻断 | 当前实现不是带 Draft Mode 的草稿内容读取，且没有已验证 URL 过期与 `X-Robots-Tag: noindex`。未实现并真实验证前不得声明可上线 Preview。 |
| REST 鉴权加固 | 待验证 | 对未授权、过期、撤销、越权 token、错误 Origin、非法 `filter`/`populate`/query 与限流逐项测试；预期 400/401/403/429，禁止 500 或数据泄露。 |

签名 webhook 真实验收要求在密钥已注入的受控 runner 内完成。报告只保留事件 ID、时间、HTTP 状态、重试次数、去重结果、告警 ID 和关联日志 ID；不得记录 HMAC、secret 或完整请求头。

## 7. 真实浏览器验收

当前状态：**待外部执行**。此前桌面/移动回归仅为本地隔离证据，不能替代预发布、CI 或验收设备结果。

### 7.1 执行环境与最小证据

执行环境可以是已获准的 CI、预发布环境或验收设备。每次记录：环境 ID、HTTPS base URL、构建 commit/digest、浏览器/设备、视口、时间、执行人、控制台错误数、网络错误数和 DOM 断言结果。只保留少量低分辨率截图：推荐最多 6 张。

| 视口 | 必测页面 | 最小 DOM/行为断言 |
| --- | --- | --- |
| Desktop `1440x1000` | 首页、产品列表/详情、资源页、博客页、sitemap | 主内容、导航、图片、语言切换、metadata、canonical/hreflang、无错误覆盖层、无横向溢出。 |
| Mobile `390x844` | 首页、展开导航、产品列表/详情、资源页 | 菜单、筛选、卡片、图片、语言切换、页脚、无横向溢出。 |
| CMS admin desktop | `/admin` 登录、角色受限操作、编辑、草稿/发布、媒体上传 | MFA/强密码流程（如适用）、最小权限、发布状态、上传读写、审计日志。 |
| 受保护 CMS API | facts 与 resources REST | 缺 token、过期/撤销 token、越权 token、非法 query、未知 Origin 与速率限制均安全失败。 |

建议 agent-browser/Playwright 记录格式：

```text
Environment: <staging-or-acceptance-id>
Commit or artifact: <immutable-reference>
Route: https://<host>/<path>
Viewport: <width>x<height>
Console errors: 0
Network failures: 0
DOM assertions: <passed-list>
Evidence: <controlled-screenshot-or-log-reference>
```

浏览器通过条件是所有必测路由、后台操作与受保护 API 的实际证据齐全；不是仅有截图。性能验证如有 SLA，需另附 LCP/INP/CLS 或平台监控结果，不能用本地开发 LCP 提示替代。

## 8. 维护窗口、观察与回滚治理

### 8.1 待填负责人

| 角色 | 实际负责人 | 替补 | 需要确认的责任 |
| --- | --- | --- | --- |
| 发布负责人 | 待填 | 待填 | 维护窗口、变更单、门禁收敛、冻结/放量/回滚沟通。 |
| 数据库超级用户负责人 | 待填 | 待填 | globals/roles/tablespace 备份、恢复、扩展、校验和和数据库监控。 |
| 后台/CMS 验证负责人 | 待填 | 待填 | admin、RBAC、token、发布、媒体与内容抽检。 |
| 前端验证负责人 | 待填 | 待填 | 官网/API、浏览器、metadata、sitemap、缓存与 webhook 验证。 |
| 业务验收负责人 | 待填 | 待填 | 产品、资源、下载、关键业务路径和内容语义验收。 |
| 回滚决策人 | 待填 | 待填 | 触发阈值判定、回滚授权和事后处置。 |

### 8.2 维护窗口模板

| 字段 | 当前值 |
| --- | --- |
| 计划日期 / 时区 | 待用户与发布负责人填写；建议 Asia/Shanghai。 |
| 预计维护时长 | 建议 2-4 小时。 |
| 内容冻结开始 | T-24 小时确认，T-0 生效。 |
| 最终超级用户备份 | T+0 至 T+30 分钟；完成 checksum 后才可继续。 |
| 全新库复演 | T+30 至 T+90 分钟；Node 20、schema copy、upgrade、三类 verifier。 |
| 受控配置和健康检查 | T+90 至 T+120 分钟；仅预发布/受控 origin。 |
| 并行验收 | T+120 至 T+180 分钟；CMS、前端、业务、基础设施。 |
| v4 观察期 | 建议 72 小时，最低 24 小时。 |

观察期间禁止 v4/v5 双写。内容编辑必须冻结；如确有紧急内容变更，只允许由发布负责人指定的唯一权威系统写入，并记录数据处置方案。

### 8.3 回滚时限与触发阈值

建议目标：发现阻断事件后 **5 分钟内开始**冻结 v5 写入与放量，**15 分钟内完成** v4 路由恢复及 v4 健康检查；实际 RTO/RPO 必须由发布负责人、DBA 和基础设施负责人签字确认。

立即回滚/停止放量的触发条件：

- v5 `/admin` 不可用，登录、MFA、角色或高权限操作异常。
- facts/REST 5xx 或 401/403 异常率高于基线并持续 5 分钟。
- 数据、发布状态、关联、媒体/下载、权限、CORS、TLS/代理、限流、SEO/sitemap 或 webhook 出现高影响异常。
- 媒体大量 404、CDN 回源失败、敏感响应缓存或未授权数据暴露。
- 业务验收、DBA、前端或发布负责人拒绝验收。

回滚步骤：冻结内容和 v5 写入 -> 停止 webhook/缓存刷新 -> 将流量切回保留 v4 与 v4 数据源 -> 验证 v4 admin、facts、resources、官网、媒体和 sitemap -> 保留 v5 副本只读取证 -> 在观察期后由负责人决定任何人工数据补录。禁止用 v5 覆盖 `industrial_cms`，禁止原地降级 v5。

## 9. 最终上线审批矩阵

每一行必须填入真实证据链接/路径、执行日期和负责人。空白、仅模板或仅本地报告均不算通过。

| 门禁 | 当前状态 | 必需证据 | 责任人 | 审批状态 |
| --- | --- | --- | --- | --- |
| 本地隔离迁移、数据等价、API/官网回归 | 通过 | phase-3 和 continuation JSON 报告、截图 | CMS / 前端 | 已有本地证据 |
| 真实预发布/生产等价环境访问与部署 | 阻断 | 平台/服务标识、HTTPS 域名、隔离数据库、测试桶、代理/CDN、CI、监控和负责人授权 | 基础设施 / DBA / 发布 | `docs/strapi-v5-phase5-prestaging-access-gate-20260713.md` |
| 生产/预发布 v5 部署目标与 Node 20 | 待验证 | 服务 ID、artifact digest、Node 20 build/start 日志 | 基础设施 / 发布 | 待填 |
| PostgreSQL 超级用户切换前备份 | 阻断 | manifest、globals audit、TOC、extensions、SHA256、受控存储引用 | DBA | 待填 |
| 从最新备份的全新库复演 | 待验证 | restore log、verifier 报告、数据库名、负责人 | DBA / CMS | 待填 |
| secret manager、RBAC、MFA、token 轮换 | 待验证 | 无值配置清单、轮换/撤销/审计演练编号 | CMS / 基础设施 | 待填 |
| 对象存储、媒体备份与 CDN | 阻断 | 上传/读/删/恢复/purge/权限测试报告 | 基础设施 | 待填 |
| CORS、TLS、代理、缓存、限流 | 待验证 | 只读 probe JSON、代理审阅、429/超时与缓存头证据 | 基础设施 | 待填 |
| webhook 签名、重试、告警、持久幂等 | 阻断 | 真实 delivery、去重、重试、告警和故障测试证据 | 前端 / 基础设施 | 待填 |
| Draft Preview 鉴权、过期、noindex | 阻断 | Draft Mode 内容、expiry、401、`X-Robots-Tag`/robots 测试证据 | 前端 / CMS | 待填 |
| REST 鉴权与错误输入加固 | 待验证 | 未授权、过期、越权、非法 query、Origin、429 的实际结果 | CMS / 基础设施 | 待填 |
| 真实浏览器与后台验收 | 待验证 | CI/预发布/验收设备报告、少量截图、console/network/DOM 结果 | 前端 / CMS / 业务 | 待填 |
| 维护窗口、72 小时观察、回滚签字 | 待验证 | 已填负责人、时间线、阈值、RTO/RPO 与回滚授权 | 发布负责人 | 待填 |

**Go 条件：** 所有门禁为通过，证据可复核，负责人已确认，且用户明确授权实际维护窗口切换。任一阻断项、未填责任人、缺少真实环境证据或没有用户授权时，结论只能是 **Conditional Go** 或 **No-Go**。

## 10. 权威参考

- PostgreSQL `pg_dumpall`：https://www.postgresql.org/docs/current/app-pg-dumpall.html
- Strapi 5 environment variables：https://docs.strapi.io/cms/configurations/environment
- Strapi 5 middlewares：https://docs.strapi.io/cms/configurations/middlewares
- Railway PostgreSQL 指南：https://docs.railway.com/databases/postgresql
- 详细切换、恢复、观察和回滚规则：`docs/strapi-v5-production-cutover-runbook.md`
