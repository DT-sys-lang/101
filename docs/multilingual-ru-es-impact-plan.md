# ru/es 多语言影响计划

Date: 2026-07-02
Owner: CMS / Strapi / PostgreSQL thread

## 结论

当前仓库的公开 locale contract 仍然是 `zh/en`。在没有同步更新前端 routing、messages、SEO hreflang、sitemap 和 GEO locale 之前，不建议一次性开放 `ru/es` 公网路由。

最小落地方案是先做 CMS 内容录入能力的扩展，再在前端 contract 统一确认后开放公开访问。

## 现状基线

- `i18n/routing.ts` 只有 `zh/en`。
- `messages/zh.json` 和 `messages/en.json` 只有两套。
- `strapi-cms/src/api/intent-phrase/content-types/intent-phrase/schema.json` 的 `locale` 只有 `en/zh`。
- `strapi-cms/src/api/product-manual/content-types/product-manual/schema.json` 的 `locale` 只有 `en/zh/multi`。
- `strapi-cms/src/components/facts/localized-text.json` 只有 `en/zh`。
- `blog-post` 和 `case-study` 不靠独立 locale enum 存多语言，而是通过 `facts.localized-text` 承载本地化文本。

## 影响矩阵

| 领域 | 受影响对象 | 现在是否可独立改 | 说明 |
| --- | --- | --- | --- |
| CMS schema | `facts.localized-text` | 是 | 这是 ru/es 内容录入的主阻塞项，必须扩到 `en/zh/ru/es` 才能给 `blog-post`、`case-study`、`product-manual` 的标题/摘要类字段录入新语言内容。 |
| CMS schema | `intent-phrase.locale` | 是 | 只要编辑侧要录入 ru/es intent phrase，就可以单独扩 enum，不会引入派生字段。 |
| CMS schema | `product-manual.locale` | 是 | 如果手册需要按语言单独建行，可扩到 `ru/es`；若暂不产出俄语/西语手册，可先不动。 |
| CMS schema | `blog-post` / `case-study` | 部分 | 这两个类型本身没有 locale enum 压力，但它们依赖 `facts.localized-text`，所以要先扩组件。 |
| 前端 routing | `i18n/routing.ts` | 否 | 只要不开放公开路由，就应继续冻结在 `zh/en`。 |
| 前端 messages | `messages/ru.json` / `messages/es.json` | 否 | 只有公开 UI 路由开放时才需要补齐。 |
| SEO hreflang | canonical / hreflang 映射 | 否 | 公开语言集变更后必须同步，否则会出现错误的 alternate 链。 |
| sitemap | sitemap locale 计数与快照 | 否 | 公开语言集变更后必须一起改，否则验证会失败。 |
| GEO locale | GEO 可读 locale 输出 | 否 | GEO 输出应跟随前端公开 locale contract，不应先于 routing 独立扩展。 |

## 哪些只需要 enum 扩展

以下项只涉及 CMS 录入 contract，可以先做，不需要马上改前端公开路由：

- `intent-phrase.locale` 扩到 `ru/es`。
- `product-manual.locale` 扩到 `ru/es`，前提是确实需要按语言区分手册记录。
- `facts.localized-text` 扩到 `ru/es`，这是 blog、case、manual 文本录入的关键。

## 哪些必须等前端同步

以下项不能单独在 CMS 先开：

- `i18n/routing.ts` 的公开 locale 列表。
- `messages` 的新语言包。
- SEO hreflang / canonical / locale metadata。
- sitemap 语言维度。
- GEO locale contract。

原因很简单：这些都是公开可访问面的 contract，一旦只改 CMS 不改前端，内容会进入系统但不会形成一致的对外路径和元数据。

## 最小落地方案

### 阶段 1：只开放内容录入

建议先做这一阶段。

- 扩 `strapi-cms/src/components/facts/localized-text.json` 为 `en/zh/ru/es`。
- 视编辑需求扩 `intent-phrase.locale` 到 `ru/es`。
- 视手册业务需要扩 `product-manual.locale` 到 `ru/es`。
- 保持 `i18n/routing.ts`、`messages`、SEO、sitemap、GEO contract 不变。
- 继续保持 CMS 只存事实和内容，不新增 `slug`、`canonical`、`seo`、`jsonLd`、`geo`。

这一阶段的目标是让编辑可以先把俄语/西语内容录进去，但不对公网暴露新路由。

### 阶段 2：一次性开放公开语言

等前端同步确认后再做。

- 扩 `i18n/routing.ts` 到 `zh/en/ru/es`。
- 补 `messages/ru.json` 和 `messages/es.json`。
- 同步 SEO hreflang、canonical locale map、sitemap 验证、GEO locale 输出。
- 确认产品、行业、OEM、公司、资料中心所有公开页面都能稳定产出新 locale 链接。

## 推荐执行顺序

1. 先扩 `facts.localized-text`。
2. 再决定 `intent-phrase.locale` 和 `product-manual.locale` 是否同时扩容。
3. 保持前端 routing 冻结，先只做内容录入。
4. 等前端、SEO、GEO 一起确认后，再一次性开放公开 `ru/es`。

## 是否建议本轮立即实施

建议本轮只实施 CMS 侧最小扩容，不开放前端路由。

这意味着：

- 可以改 CMS schema 里的 locale enum 和 `facts.localized-text`。
- 不要改公开路由和消息资源。
- 不要提前改 SEO/GEO 派生契约。

如果当前目标是降低风险并让内容先进入系统，这是最稳的路径。
