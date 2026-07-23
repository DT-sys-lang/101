# Strapi v5 Phase 5 预发布访问门禁与交接记录

日期：2026-07-13
分支：`upgrade/strapi-v5`
阶段目标：真实预发布或生产等价环境的无生产影响部署、恢复、迁移、基础设施、安全与浏览器验收。
本次结论：**Conditional Go**。真实预发布演练未执行，因为未提供可验证的访问条件或负责人授权。

## 1. 本次只读访问审计

本次审计没有连接生产或预发布环境，也没有读取敏感环境变量、`.env` 值、平台凭据、数据库凭据或对象存储凭据。

| 访问条件 | 审计结果 | 状态 | 负责人 | 解除条件 |
| --- | --- | --- | --- | --- |
| 部署平台与项目/服务标识 | 未发现 Railway/Vercel/其他平台 CLI、MCP 资源、项目链接、部署描述或 artifact digest。 | 阻断 | 基础设施负责人 / 发布负责人 | 提供受控项目/服务标识、预发布服务名称、不可变 release digest 与只读访问方式。 |
| 预发布 Strapi HTTPS 域名 | 工作区仅有占位 URL；未提供真实 HTTPS 域名。 | 阻断 | 基础设施负责人 | 提供预发布 CMS 域名和允许执行只读 HTTPS 探测的授权。 |
| 预发布前端 HTTPS 域名 | 工作区仅有占位 URL；未提供真实 HTTPS 域名。 | 阻断 | 基础设施负责人 / 前端验证负责人 | 提供预发布官网域名、对应 release digest 与验收访问方式。 |
| 隔离 PostgreSQL | 未提供可删除数据库、集群、端口、应用 owner 或 DBA 受控访问方式。 | 阻断 | DBA 超级用户负责人 | 提供全新且非 `industrial_cms` 的恢复目标、扩展/owner 前置条件和受控恢复会话。 |
| 已审计备份恢复输入 | 仅有历史应用数据 dump；其 globals 没有角色/tablespace 定义，不能作为临近切换完整恢复点。 | 阻断 | DBA 超级用户负责人 | 生成新的超级用户备份、globals audit、TOC、extensions、SHA-256 与受控存储引用。 |
| 对象存储测试桶与 CDN | 未提供测试 bucket/container、provider、CDN、最小 IAM 或恢复策略。 | 阻断 | 基础设施负责人 | 提供隔离测试桶、无值配置键清单、上传/读/删/恢复/purge 验收权限。 |
| 反向代理 / CDN / TLS | 未提供生效配置、Ingress、证书、域名、缓存策略或允许访问的只读端点。 | 阻断 | 基础设施负责人 | 提供代理/CDN 路由摘要、TLS 证据、`X-Forwarded-*` 策略、限流与缓存策略。 |
| CI 凭据与真实 run | 工作区包含 Node 20 Strapi CI job，但没有真实 run URL/编号或平台访问条件。 | 待外部负责人确认 | 发布负责人 | 提供同一提交的 CI run、日志摘要与 release artifact digest。 |
| 日志、监控与告警入口 | 未提供日志检索、dashboard、告警策略或测试告警通道。 | 阻断 | 基础设施负责人 / 发布负责人 | 提供只读日志/监控入口与告警验证负责人；至少覆盖 5xx、401/403/429、媒体 404、数据库、webhook、证书到期。 |
| 管理员/CMS 验收账号 | 未提供受控验收账户、RBAC 测试角色或 MFA 验收方案。 | 待外部负责人确认 | CMS 验证负责人 | 在受控身份系统中创建或指定最小权限验收账户；不要共享密码或 Cookie。 |
| 业务验收和回滚联系人 | 未填实际责任人、替补或维护窗口。 | 阻断 | 发布负责人 / 用户授权人 | 填写最终审批包的负责人、替补、维护窗口、冻结时间和回滚决策人。 |

## 2. 明确没有执行的事项

本次未执行以下操作，因此不存在任何伪造的预发布证据：

- 未部署 Strapi v5 或前端到真实预发布/生产等价环境。
- 未连接、修改、恢复、迁移、清空或查询 `industrial_cms`。
- 未创建或恢复任何数据库；未调用 PostgreSQL、部署平台、对象存储或 CDN CLI。
- 未修改 DNS、流量、生产环境变量、反向代理或正式密钥；未停止 v4。
- 未执行真实管理员登录、内容编辑、草稿/发布、媒体上传、Token、Webhook、Preview 或浏览器验收。
- 未执行 `collect-phase4-infrastructure-evidence.ps1 -RunExternalChecks`，因为没有获得真实 HTTPS 地址及访问授权。

本机检查时没有发现 1337、1338、1340、5432、55432、3002、3109、3110 或 3111 的监听服务；本阶段没有启动、重启或停止它们。

## 3. 进入真实预发布演练前必须提供的信息

基础设施与发布负责人需要通过受控渠道提供下表信息。不要在聊天、文档或命令行中提供密码、Token、Cookie、私钥、完整连接串或 `.env` 内容。

| 信息组 | 需要提供的无敏感信息 | 负责人 | 用途 |
| --- | --- | --- | --- |
| 部署目标 | 平台名称、项目/环境/服务标识、Strapi root `strapi-cms`、Node `20.20.2` 策略、immutable release digest、回滚 release 标识。 | 基础设施负责人 / 发布负责人 | 确认真实部署目标及可回滚性。 |
| 域名与网络 | 前端、CMS、预览、管理域名；允许的 CORS Origin 列表；代理/CDN owner；只读探测许可。 | 基础设施负责人 | HTTPS、CORS、代理、缓存和浏览器验收。 |
| 隔离数据库 | 新数据库名 `industrial_cms_v5_locale_phase3_<timestamp>`、隔离主机/端口、PostgreSQL 版本、owner/extension 前置条件、DBA 受控会话。 | DBA 超级用户负责人 | 受保护备份恢复、升级和数据库 verifier。 |
| 备份 | 最新备份 manifest、global-object audit、SHA-256 成功结果、受控存储引用、恢复授权。 | DBA 超级用户负责人 | 证明 globals/roles/tablespaces/extensions 可恢复。 |
| 媒体 | 测试 bucket/container、provider 类型、CDN 域名、最小 IAM 角色名称、生命周期/版本/恢复策略。 | 基础设施负责人 | 上传、读取、删除、恢复、CDN 缓存失效。 |
| Secrets 与鉴权 | Secret manager 名称、无值变量键清单、注入审计编号、facts/resources token scope、管理员 MFA/RBAC 验收策略。 | CMS / 基础设施负责人 | 安全配置验证；秘密值不得离开受控系统。 |
| 可观测性 | 日志、监控、告警系统名称/链接、告警规则 ID、通知负责人、测试窗口。 | 基础设施负责人 / 发布负责人 | 健康检查、5xx/401/403/429、媒体、DB、Webhook 和证书告警。 |
| 验收 | 浏览器/设备、业务验收样本、CMS 验收角色、维护窗口、冻结时间、回滚决策人和替补。 | 前端 / CMS / 业务 / 发布负责人 | 真实浏览器、后台、内容与治理验收。 |

## 4. 受控预发布演练命令模板

以下模板在上述信息齐全、负责人允许且目标已验证为隔离环境后才可运行。占位符不得替换为 `industrial_cms`、`industrial_cms_v5_trial` 或任何生产数据库。

### 4.1 部署和只读 HTTPS 探测

部署平台命令必须由已授权的基础设施负责人在该平台受控会话中执行。部署完成后，可运行只读探测：

```powershell
.\strapi-cms\scripts\collect-phase4-infrastructure-evidence.ps1 `
  -RunExternalChecks `
  -StrapiBaseUrl 'https://<staging-cms-host>' `
  -FrontendBaseUrl 'https://<staging-frontend-host>' `
  -AllowedCorsOrigin @(
    'https://<staging-frontend-host>',
    'https://<approved-staging-preview-host>',
    'https://<approved-staging-admin-host>'
  )
```

该脚本只发出 GET/OPTIONS 请求，拒绝非 HTTPS URL，且输出 `productionCutoverAuthorized: false`。它不验证 Token 正向路径、管理员、对象存储、Webhook 或 Preview。

### 4.2 新库恢复、升级与等价验证

DBA 在受控会话中先校验最新备份，再恢复到全新数据库。恢复目标必须满足：

```text
industrial_cms_v5_locale_phase3_<timestamp>
```

恢复成功后，使用 Node `20.20.2` 构建 Strapi、执行 schema copy、运行 `locale -> contentLocale`、启动 v5，并运行：

```powershell
& $node20 .\strapi-cms\scripts\verify-phase3-production-equivalence.mjs `
  --target-database industrial_cms_v5_locale_phase3_<timestamp> `
  --target-port <isolated-postgres-port>

& $node20 .\strapi-cms\scripts\verify-phase3-api-security.mjs `
  --v4-base-url <isolated-v4-url> `
  --v5-base-url <isolated-v5-url>

& $node20 .\strapi-cms\scripts\verify-phase3-v5-website.mjs `
  --target-database industrial_cms_v5_locale_phase3_<timestamp> `
  --target-port <isolated-postgres-port> `
  --strapi-base-url <isolated-v5-url> `
  --website-port <isolated-next-port>
```

`invoke-phase3-production-equivalent-rehearsal.ps1` 只适用于本地受控、隔离 PostgreSQL 演练：它从本地 `.env` 的隔离认证设置取得数据库密码，不能作为未知预发布环境的自动部署工具。真实预发布恢复必须由 DBA 使用 secret manager 或受保护 `PGPASSFILE` 执行。

### 4.3 人工和浏览器验收

在真实预发布域名上记录每一项：环境 ID、commit/digest、URL、视口、时间、执行人、console 错误数、网络失败数、DOM 断言、HTTP 状态、日志/告警 ID 和少量低分辨率截图路径。不得记录浏览器 Cookie、认证头、Token、HMAC 或密钥。

必测范围：

- Desktop `1440x1000`：主页、产品列表/详情、资源页、博客页、导航、语言切换、图片、metadata、canonical/hreflang、sitemap。
- Mobile `390x844`：主页、展开导航、产品页、资源页、语言切换、图片、筛选、页脚和横向溢出。
- CMS admin：登录、最小权限角色、编辑、草稿/发布、媒体上传、审计日志。
- CMS API：缺失/无效/过期/越权 token、错误 Origin、非法 query/filter/populate、429 限流与无 500。
- 基础设施：HTTPS、Host、`X-Forwarded-*`、大小/超时、`/admin`/`/internal/cms` 缓存、媒体缓存、错误页、对象存储、CDN purge。
- Webhook/Preview：签名、允许事件、过期事件、失败重试、持久幂等、告警、草稿内容、expiry、`X-Robots-Tag: noindex`。

## 5. 第五阶段门禁状态

| 门禁 | 本次状态 | 负责人 | 解除方式 |
| --- | --- | --- | --- |
| 真实预发布环境访问 | 阻断 | 基础设施负责人 / 发布负责人 | 提供受控平台、真实 HTTPS 域名与只读/部署权限。 |
| 隔离 PostgreSQL 与新库恢复 | 阻断 | DBA 超级用户负责人 | 提供最新完整备份、隔离恢复目标与 DBA 执行证据。 |
| v5 部署、迁移、等价/API/网站 verifier | 未执行 | DBA / CMS / 发布负责人 | 完成新库恢复和 Node 20.20.2 部署后保留脱敏报告。 |
| 代理、TLS、CORS、缓存、限流 | 未执行 | 基础设施负责人 | 对真实域名运行只读 probe 并提供配置/监控证据。 |
| Token、RBAC、MFA、管理员流程 | 未执行 | CMS / 基础设施负责人 | 提供受控测试账号/角色和审计结果。 |
| 对象存储、媒体、CDN | 阻断 | 基础设施负责人 | 配置隔离测试桶/持久存储并完成上传、恢复和 purge。 |
| Webhook 重试、告警、持久幂等 | 阻断 | 前端 / 基础设施负责人 | 实现或配置持久去重，验证真实 delivery、重试和告警。 |
| Draft Preview expiry/noindex | 阻断 | 前端 / CMS 负责人 | 实现并真实验证 Draft Mode、expiry 和 noindex。 |
| 真实浏览器、后台、业务验收 | 未执行 | 前端 / CMS / 业务验收负责人 | 在真实预发布域名或验收设备完成记录。 |
| 维护窗口、冻结、72 小时观察与回滚签字 | 阻断 | 发布负责人 / 回滚决策人 | 填写审批包所有负责人、时间线、RTO/RPO 和授权。 |

## 6. 最终结论

**Conditional Go 保持不变。**

已完成的本地隔离证据不能被升级为真实预发布或生产等价证据。未具备真实环境访问条件、最新超级用户备份、隔离恢复、对象存储、代理/CDN、监控告警、真实浏览器/后台验收和具名负责人前，不得发出 Go，也不得进入实际生产切换线程。

`productionCutoverAuthorized` 必须继续为 `false`，直到所有审批门禁均有真实证据、负责人确认，并且用户明确书面授权执行维护窗口切换。
