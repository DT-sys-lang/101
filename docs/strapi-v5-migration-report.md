# Strapi v4 到 v5 试迁移报告

日期：2026-07-12
升级分支：`upgrade/strapi-v5`
范围：`strapi-cms`、`lib/cms` 接入边界及 locale 冲突隔离迁移演练
第二阶段结论：**业务 `locale` 冲突已解除，隔离恢复库演练和前端 v5 接入验证通过，可进入正式切换准备阶段；尚不批准直接对生产切流。**

## 1. 安全边界

本阶段始终遵守以下边界：

- v4 源库 `industrial_cms` 位于 `127.0.0.1:5432`，只进行了只读对账；未执行迁移、清空、恢复或重置。
- v4 后台 `http://127.0.0.1:1337/admin` 保持运行并验证 HTTP 200。
- 原有 v5 trial 库 `industrial_cms_v5_trial` 位于 `127.0.0.1:55432`，后台 `http://127.0.0.1:1338/admin` 保持不变并验证 HTTP 200。
- 本阶段全部 Strapi 构建、迁移和 v5 启动均使用 `C:\Users\51352263344\nodejs\node-v20.20.2-win-x64\node.exe`，即 Node `20.20.2`；未使用系统 Node 24 运行 Strapi。
- 既有官网 UI/品牌未提交改动没有被回退、覆盖或格式化；没有执行 `git reset --hard`、`git checkout --` 或任何生产库破坏性命令。
- 既有备份未被覆盖：`D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211`。

## 2. 备份与恢复输入

本阶段的恢复输入为以下 PostgreSQL custom dump：

```text
D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211\database\industrial_cms_pre_strapi_v5.dump
```

该备份在前一阶段已通过 `pg_restore -l` 校验。应用角色无法读取 `pg_authid`；正式生产恢复前仍需由 PostgreSQL 超级用户补充完整的角色和全局对象备份。

## 3. locale 业务语义审计

三个冲突字段都不是 Strapi i18n 的翻译身份，均采用业务字段改名方案。

| Content type | v4 表 / 稳定业务 ID | 原 `locale` 业务语义 | v4 记录与取值 | i18n 决策 |
| --- | --- | --- | --- | --- |
| `document-asset` | `document_assets.fact_id` | 文档或媒体的内容覆盖标签；`multi` 表示同一资产支持多语内容，不表示一个 Strapi 翻译版本。 | 20 条稳定记录：`NULL` 15、`multi` 5；均已发布。 | 不接入 i18n。 |
| `product-manual` | `product_manuals.manual_id` | 手册覆盖语言标签；全部为 `multi`，表示多语手册。 | 6 条稳定记录：`multi` 6；5 条已发布、1 条草稿。 | 不接入 i18n。 |
| `intent-phrase` | `intent_phrases.phrase_id` | 作者维护的短语语言标签。`en` 与 `zh` 是独立短语记录，而不是同一文档的翻译组。 | 4 条稳定记录：`en` 2、`zh` 2；均已发布。 | 不接入 i18n。未来只有建立明确翻译组、编辑工作流和关联本地化语义后才考虑单独接入。 |

**禁止映射：** 任何 `multi` 值都不得写入 Strapi v5 系统 `locale`。三个 content type 的 schema 均显式设为 `pluginOptions.i18n.localized: false`。

## 4. 数据映射

| v4 物理列 | v5 schema 属性 | v5 物理列 | 数据规则 |
| --- | --- | --- | --- |
| `document_assets.locale` | `contentLocale` | `document_assets.content_locale` | 原值不变：`NULL` 15、`multi` 5。 |
| `product_manuals.locale` | `contentLocale` | `product_manuals.content_locale` | 原值不变：`multi` 6。 |
| `intent_phrases.locale` | `contentLocale` | `intent_phrases.content_locale` | 原值不变：`en` 2、`zh` 2。 |
| 无业务等价列 | Strapi v5 系统 `locale` | `locale` | 对这三个非本地化 content type 保持 `NULL`；不得承载业务值。 |
| v4 无此字段 | Strapi v5 系统 `documentId` | `document_id` | 由 v5 升级迁移生成，每个稳定业务记录恰有一个 `documentId`。 |

v5 的草稿/发布迁移会为已发布 v4 记录生成草稿和发布物理行；这不是业务记录重复：稳定业务 ID 与 `documentId` 均保持一对一。

## 5. 代码和数据迁移实现

### Schema、种子与导入

以下 schema 的业务字段已由 `locale` 改为 `contentLocale`，并明确关闭 i18n 本地化：

- `strapi-cms/src/api/document-asset/content-types/document-asset/schema.json`
- `strapi-cms/src/api/product-manual/content-types/product-manual/schema.json`
- `strapi-cms/src/api/intent-phrase/content-types/intent-phrase/schema.json`

事实 API、种子、导入、fixture 和领域类型均使用 `contentLocale`。`lib/cms/business-locale.ts` 作为唯一跨版本兼容边界：

- v4 facts API 的 `documents[].locale` 被投影为 `documents[].contentLocale`。
- v5 如携带 `documentId` 和系统 `locale`，系统字段会从领域输入中剥离；业务数据只接收 `contentLocale`。
- 同一 v4 输入同时携带不同的 `locale` 与 `contentLocale` 会拒绝；v5 记录缺少 `contentLocale` 也会拒绝。
- 页面仍只通过 `lib/cms` 和领域适配器读取数据，不依赖原始 Strapi v4/v5 JSON。

### 可重复数据脚本

| 脚本 | 作用与安全约束 |
| --- | --- |
| `strapi-cms/scripts/migrate-business-locale-to-content-locale.mjs` | 事务内执行三张表的物理列改名。要求 Node `20.20.2`，只接受新建的 `industrial_cms_v5_locale_*` 库，拒绝 `industrial_cms` 和 `industrial_cms_v5_trial`，拒绝已有 `document_id` 的数据库；使用 advisory lock、稳定 ID/值 checksum 和关系数量前后校验。首次 v5 启动前的重复执行返回 `already-applied`；v5 已生成 `document_id` 后会按前置条件拒绝，改用只读 verifier。 |
| `strapi-cms/scripts/restore-locale-trial.ps1` | 只创建不存在的新 `industrial_cms_v5_locale_*` 库到 `55432`，从备份恢复并调用上述迁移脚本。不会覆盖任何已有库；失败库会保留以便诊断。运行前检查 src 与 dist schema 都含 `contentLocale`，且不含旧业务 `locale`。 |
| `strapi-cms/scripts/verify-business-locale-trial.mjs` | 在 v5 已启动后只读对比 `industrial_cms@5432` 和新 trial。检查稳定 ID、`contentLocale`、`documentId`、草稿/发布语义、10 类关系签名、文件引用数，以及这三个非本地化模型的系统 `locale` 为 `NULL`。 |
| `strapi-cms/scripts/verify-business-locale-api.mjs` | 只读比较 v4/v5 facts API 的文档业务语言映射，并审计 v5 已公开的 `product-manuals` REST 输出。`intent-phrase` 未定义公开 REST router，因而由数据库验证器覆盖其值与关联。 |

### 运行前置条件和标准演练命令

必须先以 Node 20 构建 Strapi 并同步 JSON schema 到运行产物；直接调用 Strapi CLI `build` 不会触发 package 的 `postbuild`，因此两步都必需：

```powershell
$node20 = 'C:\Users\51352263344\nodejs\node-v20.20.2-win-x64\node.exe'
Push-Location .\strapi-cms
& $node20 .\node_modules\@strapi\strapi\bin\strapi.js build
& $node20 .\scripts\copy-strapi-json.mjs
Pop-Location

.\strapi-cms\scripts\restore-locale-trial.ps1 `
  -Database industrial_cms_v5_locale_<new_name> `
  -Port 55432
```

随后仅让一个新的 v5 实例连接该新库，例如：

```powershell
$env:HOST = '127.0.0.1'
$env:PORT = '1339'
$env:PUBLIC_URL = 'http://127.0.0.1:1339'
$env:DATABASE_HOST = '127.0.0.1'
$env:DATABASE_PORT = '55432'
$env:DATABASE_NAME = 'industrial_cms_v5_locale_<new_name>'
$env:DATABASE_USERNAME = 'strapi'
$env:DATABASE_PASSWORD = '<isolated-password>'
& $node20 .\strapi-cms\node_modules\@strapi\strapi\bin\strapi.js start
```

迁移完成后执行：

```powershell
& $node20 .\strapi-cms\scripts\verify-business-locale-trial.mjs `
  --target-database industrial_cms_v5_locale_<new_name> `
  --target-port 55432

$env:INTERNAL_CMS_FACTS_TOKEN = '<facts-token>'
$env:CMS_RESOURCES_API_TOKEN = '<resource-token>'
& $node20 .\strapi-cms\scripts\verify-business-locale-api.mjs `
  --v4-base-url http://127.0.0.1:1337 `
  --v5-base-url http://127.0.0.1:1339
```

## 6. 隔离恢复库演练结果

### 诊断性第一次尝试

`industrial_cms_v5_locale_20260712_phase2` 由备份创建并成功完成列改名，但第一次 v5 启动前使用了过期的 `dist` JSON schema。v5 因而未识别 `contentLocale`，草稿克隆没有复制该列。该数据库已保留作为失败诊断证据，未被原地修补，不作为通过依据。

根因已在恢复脚本前置检查中固化：必须先以 Node 20 build，并运行 `copy-strapi-json.mjs`，确保运行产物与 source schema 一致。

### 通过的干净演练库

```text
数据库：industrial_cms_v5_locale_20260712_phase2_rehearsal2
主机/端口：127.0.0.1:55432
恢复来源：industrial_cms_pre_strapi_v5.dump
v5 实例：http://127.0.0.1:1339/admin
Strapi：5.50.1，Node 20.20.2
状态：运行中；v5 数据迁移、数据库对账和 API 对账均通过
```

关键可审计报告：

- `tmp/strapi-v5-locale/industrial_cms_v5_locale_20260712_phase2_rehearsal2-rename-report.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_20260712_phase2_rehearsal2-database-verification.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_20260712_phase2_rehearsal2-api-verification.json`

数据库验证结果：`ok: true`、无 failures。

| 表 | v4 稳定记录 | v5 物理行 | v5 稳定记录 / `documentId` | `contentLocale` 结果 | v5 系统 `locale` |
| --- | ---: | ---: | ---: | --- | --- |
| `document_assets` | 20 | 40 | 20 / 20 | `NULL` 15、`multi` 5 | 40 行均为 `NULL`；0 个 `multi`。 |
| `product_manuals` | 6 | 11 | 6 / 6 | `multi` 6 | 11 行均为 `NULL`；0 个 `multi`。 |
| `intent_phrases` | 4 | 8 | 4 / 4 | `en` 2、`zh` 2 | 8 行均为 `NULL`；0 个 `multi`。 |

以下关系签名与 v4 源库完全一致：手册-文档 6、手册-产品 6、手册-分类 5、手册-意图 10、意图-产品 16、意图-分类 6、意图-行业 4、意图-应用 4、产品-文档 10、产品-资产 10。文件引用计数也一致。

第一次 trial 在 v5 首次启动前第二次执行迁移脚本返回 `already-applied`，证明列改名步骤可安全重复检查而不会再次修改数据。v5 生成 `document_id` 后，脚本按设计拒绝再次运行，后续重复验证使用只读 verifier。

## 7. API 与官网验证

### 后台与 API

- v4 管理端 `http://127.0.0.1:1337/admin`：HTTP 200。
- 原 v5 管理端 `http://127.0.0.1:1338/admin`：HTTP 200。
- 新干净 v5 管理端 `http://127.0.0.1:1339/admin`：HTTP 200。
- 新 v5 facts API：8 个分类、10 个产品；`prd_yf_p10` 的文档为 `contentLocale: "multi"`。
- v4 facts API 同一业务文档仍为 legacy `locale: "multi"`；`lib/cms` 已将其兼容投影为 `contentLocale`。
- API 验证器确认 v4/v5 各有 10 个 facts 文档、5 个 `multi` 文档稳定 ID 完全相同；v5 发布的 5 条手册均为 `contentLocale: "multi"`，没有系统 locale 泄露。
- 新 v5 REST：`blog-posts` 2、`case-studies` 1、`product-manuals` 5、`industry-ecosystem-recommendations` 1，均为 HTTP 200 并包含 v5 `documentId`；手册业务字段为 `contentLocale`。

### 官网 v5 数据源验收

创建了独立的 Next.js 验证实例 `http://127.0.0.1:3109`，环境变量为：

```text
CMS_SOURCE_MODE=cms-facts-api
CMS_FACTS_API_URL=http://127.0.0.1:1339/internal/cms/facts
CMS_RESOURCES_API_URL=http://127.0.0.1:1339
CMS_STRAPI_API_VERSION=5
```

它不复用或停止现有 `3002` 的 v4 服务。验证结果：

| 路径 | 结果 |
| --- | --- |
| `/en` | HTTP 200，未发现 Next 错误覆盖层。 |
| `/en/products` | HTTP 200，未发现 Next 错误覆盖层。 |
| `/en/resources` | HTTP 200，未发现 Next 错误覆盖层。 |
| `/en/resources/blog` | HTTP 200，未发现 Next 错误覆盖层。 |
| `/sitemap.xml` | HTTP 200。 |
| `/api/cms/status` | HTTP 200；报告上游模式为 `cms-facts-api`，10 个产品，边界为 `adapter/domain`。 |

本次环境没有可用的 `agent-browser` 二进制，因此第二阶段使用了 HTTP 响应、Next 渲染日志和错误覆盖层检测；正式发布前仍需在 CI 或具备浏览器自动化的环境补做桌面与移动端视觉截图回归。

## 8. 本轮构建与质量验证

| 命令 | 结果 |
| --- | --- |
| `npm run validate:strapi-response` | 通过；包含 v4 `locale -> contentLocale`、v5 系统字段剥离及冲突拒绝样本。 |
| `npm run typecheck` | 通过。 |
| `npm run lint` | 通过。 |
| `npm run build` | 通过。为避免影响运行中的开发服务，本次通过 `NEXT_DIST_DIR=tmp/strapi-v5-locale/next-build-phase2` 运行隔离构建；默认配置仍使用 `.next`。 |
| Node 20 Strapi build + JSON copy | 通过；确认 src 和 dist 三个 schema 均为 `contentLocale`、没有旧业务 `locale`，且 `localized: false`。 |

## 9. 回滚方式

本阶段没有生产切流，也没有修改 `industrial_cms`，因此当前回滚就是维持既有 v4：

1. 流量和前端环境保持或切回现有 v4 部署，`CMS_STRAPI_API_VERSION=4`。
2. 不对任何 v5 数据库做原地降级。
3. 若需重新演练，使用上述 dump 恢复到新的、此前不存在的 `industrial_cms_v5_locale_*` 数据库；不要覆盖已有 trial。
4. 保留 v4 服务、备份和可运行 v4 构建产物直至观察期结束。
5. 生产切换窗口中若失败，停止 v5 流量并回到 v4；仅将切换前新备份恢复到另一个新建验证库后再按受控流程提升。

## 10. Go / No-Go 与剩余上线门禁

### 结论

- **Locale 冲突项：Go。** 三个业务字段的语义已审计；`locale -> contentLocale` 数据映射、schema、导入/种子、CMS facts、领域类型、兼容边界、数据库迁移与 API 输出均已在从备份新建的隔离库验证。
- **进入正式切换准备阶段：Go。** 可以安排变更窗口、生产环境预演与最终切换清单。
- **立即生产切流：No-Go。** 下列生产门禁尚未全部完成。

### 仍未满足的生产切换条件

1. 由 PostgreSQL 超级用户完成一份临近切换时刻的完整数据库和全局对象/角色备份。
2. 在生产等价的全新 v5 恢复库上重复本报告的 restore、Node 20 build、database verifier、API verifier 和前端 v5 验收。
3. 完成生产环境的 API token、管理员账户、上传存储、CORS、反向代理、`PUBLIC_URL`、Webhook、再验证密钥与预览流程验证；将缺失 REST token 时的 `ForbiddenError` 响应加固为明确的 401/403。
4. 在具备 Playwright 或 `agent-browser` 的 CI/验收环境执行桌面和移动端页面截图回归，确认官网现有品牌视觉没有回归。
5. 确定维护窗口、切流负责人、v4 保留时长、观察指标与明确回滚决策时限。
6. 切流前重新备份 v4 生产库；只在全部门禁通过后让 v5 连接正式切换副本，绝不原地升级 `industrial_cms`。

## 11. 参考资料

- [Strapi：v4 到 v5 逐步迁移](https://docs.strapi.io/cms/migration/v4-to-v5/step-by-step)
- [Strapi：v5 新响应格式](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/new-response-format)
- [Strapi：使用 documentId](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/use-document-id)
- [Strapi Upgrade Tool](https://docs.strapi.io/cms/upgrade-tool)

## 12. 第三阶段：生产切换门禁与生产等价复演

### 12.1 准入与安全边界

第二阶段的准入结论有效：`locale -> contentLocale` 已在全新隔离库完成，三个业务字段均不接入 v5 i18n 系统 `locale`。本阶段没有修改、恢复、清空或重置 `industrial_cms`；没有停止 v4 `http://127.0.0.1:1337/admin`，没有覆盖既有备份或 `industrial_cms_v5_trial`。

### 12.2 新隔离库完整复演

```text
数据库：industrial_cms_v5_locale_phase3_20260712_rehearsal6
PostgreSQL：127.0.0.1:55432
v5 管理端：http://127.0.0.1:1340/admin
升级链路：4.25.20 -> 4.26.2 -> 5.50.1
Node：20.20.2
状态：通过
```

该库由既有 v4 custom dump 恢复到此前不存在的新数据库。隔离 v4 `4.25.20`、`4.26.2`、v5 admin 均健康；业务列迁移在 v5 首次接触数据库前执行。可审计报告：

- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-phase3-rehearsal.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-phase3-equivalence.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-api-security.json`
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-phase3-v5-website.json`

产品、分类、文章、案例、文档资产、手册和意图短语的稳定记录数/发布状态相同：产品 10/10、分类 8/8、文章 3/2、案例 2/1、文档资产 20/20、手册 6/5、意图短语 4/4（稳定记录/已发布）。26 个关系签名族与媒体引用计数一致。v5 的草稿/发布物理行增加并不表示业务记录重复；每个稳定 ID 都有一个 `documentId`。

| 表 | 稳定记录的 `contentLocale` | v5 系统 `locale` |
| --- | --- | --- |
| `document_assets` | `NULL` 15、`multi` 5 | 全部 `NULL` |
| `product_manuals` | `multi` 6 | 全部 `NULL` |
| `intent_phrases` | `en` 2、`zh` 2 | 全部 `NULL` |

### 12.3 备份门禁与恢复方案

既有目录 `D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211` 的 custom dump 含表定义和 104 份表数据，可作为应用数据演练输入；但其 `postgres_globals.sql` 只有 229 bytes、零个 `CREATE ROLE`/`CREATE TABLESPACE`，custom dump TOC 也没有 ACL 或 extension 项。根因是 `strapi` 应用角色无法读取 `pg_authid`。因此它不能被称为完整生产恢复点。

新增 `strapi-cms/scripts/create-production-cutover-backup.ps1` 要求 PostgreSQL 超级用户和显式 `-AllowProductionDatabase` 才能指向 `industrial_cms`。它创建时间戳 custom/plain/global dump、TOC、extension manifest、SHA-256、非敏感 global-object audit 和 `RESTORE.md`；若 globals 缺少角色或预期 tablespace，会拒绝完成。生产级备份没有在本轮执行，因为没有获得生产超级用户凭据。

恢复顺序固定为：校验 SHA-256 -> DBA 审阅 globals -> 仅在干净替代集群恢复 `postgres-globals.sql` -> 创建全新验证库 -> `pg_restore` custom dump -> 核对扩展、owner/权限、Strapi 与等价 verifier。同一现有集群的演练不得重新导入 globals，且任何恢复目标不得为 `industrial_cms`。

### 12.4 API、官网与安全回归

- v4 `http://127.0.0.1:1337/admin`、既有 v5 trial `http://127.0.0.1:1338/admin`、phase-3 v5 `http://127.0.0.1:1340/admin` 均返回 HTTP 200。
- phase-3 v5 facts：缺 Token 403、正确 Token 200；非白名单 Origin 不回显，白名单预检 204。
- phase-3 v5 REST：缺/错 Token 为 401，未鉴权畸形 filter/populate 不会返回 500；临时 read-only Token 的畸形 query 返回 400。
- v5 资源 REST：文章 2、案例 1、手册 5；手册输出只包含业务 `contentLocale` 和 v5 `documentId`，不泄露系统 `locale`。临时 Token 在验证结束后被吊销，随后返回 HTTP 401。
- 独立 Next v5 验证保持 `lib/cms -> adapter/domain` 边界；`/en`、`/en/products`、`/en/resources`、`/en/resources/blog`、`/sitemap.xml` 均为 HTTP 200、带 title/description，未检测到 Next 错误页。资源集合页的 metadata 缺口已修复。
- 本机没有 `agent-browser`、Playwright 或 Puppeteer；已有低分辨率桌面/移动 v5 首页截图仅作人工参考，切换前仍需在 CI 或验收设备执行浏览器自动化视觉回归。

### 12.5 生产门禁矩阵

| 门禁 | 状态 | 责任人 | 解除条件 |
| --- | --- | --- | --- |
| locale 迁移、数据等价、升级链路 | 通过 | CMS 验证负责人 | 切换日前用最新完整备份重复一次 |
| 超级用户级数据库/角色/tablespace/globals 备份 | 阻断 | DBA | 完成新脚本、globals audit、checksum 与加密保存 |
| 从最新备份恢复到全新生产等价库 | 待外部执行 | DBA / 发布负责人 | 完整 restore/upgrade/API/官网复演通过 |
| 管理员、RBAC、API token、secret manager | 待外部配置 | CMS / 基础设施负责人 | 最小权限、MFA、轮换、撤销和审计演练 |
| 上传、媒体备份、CDN | 阻断 | 基础设施负责人 | 持久存储或对象存储、读写删、备份恢复、CDN 通过 |
| CORS、TLS 反代、`X-Forwarded-*`、限流 | 待外部配置 | 基础设施负责人 | 正式/预览域名端到端验证 |
| Webhook 重试、告警、持久幂等 | 阻断 | 前端 / 基础设施负责人 | 真实 webhook 与去重、告警链路通过 |
| Draft Preview 鉴权、过期、noindex | 阻断 | 前端 / CMS 负责人 | 实现并验证真实草稿预览和不可索引控制 |
| 桌面/移动浏览器自动化视觉回归 | 待外部执行 | 前端验证负责人 | CI/验收环境截图、DOM、控制台检查通过 |
| 维护窗口、观察、回滚签字 | 待外部配置 | 发布负责人 | 2-4 小时窗口、72 小时 v4 保留、联系人和阈值明确 |

详细备份、恢复、负责人、维护窗口、回滚和观察期规则见 `docs/strapi-v5-production-cutover-runbook.md`。观察期内禁止 v4/v5 双写，内容编辑进入冻结队列；回滚先停止 v5 流量和写入、切回保留 v4，绝不原地降级 v5 或以 v5 覆盖 `industrial_cms`。

### 12.6 最新结论

**Conditional Go。** 允许等待用户批准进入维护窗口准备；不允许直接生产切流。唯一的生产切换前提是所有阻断/待外部门禁完成、最新完整备份上的新库复演通过，并由发布负责人获得用户明确的切换授权。
