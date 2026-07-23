# Strapi 后台录入指南

本文面向 Strapi 后台录入人员。目标是让产品、图片、文档、博客、案例、产品手册、行业生态搭配和搜索意图词可以稳定录入，同时保持 CMS 只作为事实和内容层。

## 基本边界

- CMS 只存 facts 和内容，不存 `slug`、`canonical`、`seo`、`jsonLd`、`geo`、`breadcrumb`、`identity`、`classification`、`categoryPath`。
- 前台路径、SEO、GEO、JSON-LD、面包屑都由后端 adapter/runtime 生成。
- 不要在任何 JSON 字段里手写 Strapi envelope，例如 `data`、`attributes`、`meta`。
- `lifecycle` 只作为后台内部编辑状态，不作为前台 SEO/GEO 或公开模型依赖。
- `hrefOverride` 优先级高于上传文件的 `file.url`。如果同时填写 `hrefOverride` 和上传 `file`，聚合器使用 `hrefOverride`。

## ID 命名规则

所有 ID 使用小写 snake_case，只使用小写字母、数字和下划线。ID 创建后不要因为标题、型号或语言变化而修改。

| 内容类型 | 字段 | 前缀 | 示例 |
| --- | --- | --- | --- |
| CategoryFact | `factId` | `cat_` | `cat_pressure_transmitters` |
| ProductFact | `factId` | `prd_` | `prd_yf_p100` |
| IndustryFact | `factId` | `ind_` | `ind_water_treatment` |
| ApplicationFact | `factId` | `app_` | `app_pump_monitoring` |
| DocumentAsset document | `factId` | `doc_` | `doc_yf_p100_datasheet` |
| DocumentAsset media | `factId` | `asset_` | `asset_yf_p100_primary` |
| BlogPost | `postId` | `blog_` | `blog_pressure_sensor_selection` |
| CaseStudy | `caseId` | `case_` | `case_water_pump_station_2026` |
| ProductManual | `manualId` | `manual_` | `manual_yf_p100_installation` |
| IndustryEcosystemRecommendation | `recommendationId` | `eco_` | `eco_water_pump_pressure_package` |
| IntentPhrase | `phraseId` | `intent_` | `intent_pressure_transmitter_price` |
| CompanyPage | `pageId` | `company_` | `company_about` |

## 本地化文本

`LocalizedText` 当前要求 `en` 和 `zh` 必填，`ru` 和 `es` 可选。

录入原则：

- `en`、`zh` 先保证可用，缺少翻译时可以先用同一份业务可读文本占位。
- `ru`、`es` 只在已有真实翻译时填写。
- 不要在本地化文本里写 SEO 标题、canonical、slug 或 GEO 描述。

## CategoryFact

用途：维护产品分类树。

必填：

- `factId`：`cat_` 开头。
- `name`：本地化分类名。

常用：

- `parent`：选择父级分类。根分类留空。

录入规则：

- 只维护事实分类名和父子关系。
- 不要录入 URL、slug、层级深度、面包屑或 SEO 字段。
- 一个分类只能有一个父级。

示例：

```txt
factId: cat_pressure_transmitters
parent: cat_pressure_sensors
name.en: Pressure Transmitters
name.zh: Pressure Transmitters
```

## ProductFact

用途：维护产品事实。产品分为 `sensor` 和 `valve` 两类。

### 通用必填

所有产品都需要填写：

- `factId`：`prd_` 开头。
- `family`：`sensor` 或 `valve`。
- `sku`：商业 SKU，必须唯一。
- `model`：型号，例如 `YF-P100`。
- `brand`：品牌。
- `availability`：供货状态。
- `revisedAt`：事实更新时间。
- `primaryCategory`：主分类。
- `name`、`shortName`、`summary`：本地化内容。
- `specificationGroups`：至少一个规格组。

通用建议填写：

- `seriesId`：`ser_` 开头，用于产品系列归组。
- `manufacturer`：制造商。
- `industries`、`applications`：选择相关行业和应用。
- `highlights`、`applicationCopy`：用于产品内容摘要。

内部状态：

- `lifecycle` 可用于后台内部标记 `draft`、`active`、`phase-out`、`discontinued`、`hidden`。
- 前台 SEO/GEO 不应依赖 `lifecycle`。

可选项：

- `documents`
- `assets`
- `certifications`
- `commercialTerms`
- `additionalCategories`
- `variants`

这些字段可以后补，不要求所有产品一次录齐。

### ProductFact 分类选择

- `primaryCategory` 必须选择分类树中最深、最准确的真实分类节点。例如压力变送器应直接选择 `cat_pressure_transmitters`，而不是只选“工业传感器”或“压力传感器”。
- **不需要新增或填写自由文本的一级/二级分类标签。** 前台会根据 `CategoryFact.parent` 自动推导完整的一级、二级、三级分类、面包屑和产品路径。
- `additionalCategories` 仅用于补充筛选或跨类归属；它不会改变产品的主目录、规范路径或由 `primaryCategory` 推导出的分类层级。

### 传感器产品必填

当 `family=sensor` 时，最低需要：

- `measurements`：至少一条测量事实。
- `outputs`：至少一条输出事实。
- `specificationGroups`：至少一个规格组。

`measurements` 每条需要：

- `kind`：例如 `pressure`、`temperature`、`flow`。
- `range.min`、`range.max`、`range.unit`、`range.display`。
- `overloadLimit.value`、`overloadLimit.unit`、`overloadLimit.display`。

`outputs` 每条需要：

- `kind`：例如 `analog-current`、`analog-voltage`、`relay`。
- `value`：例如 `4-20 mA`。
- `protocol`、`wiring` 可选。

传感器建议填写：

- `connections`：过程连接和电气连接。
- `environmentalLimits`：防护等级、温度范围、接液材质、兼容介质。

### 阀门产品必填

当 `family=valve` 时，最低需要：

- `valveProfile`
- `specificationGroups`

`valveProfile` 必填字段：

- `pressureRating`：例如 `PN16`。
- `connection`：例如 `G1/2`、`flange DN50`。
- `material`：例如 `316L stainless steel`。
- `mode`：例如 `normally closed`、`manual`、`modulating`。
- `compatibleMedia`：JSON 数组，例如 `["water", "compressed air"]`。
- `size`：例如 `DN15`。

阀门不需要填写传感器专用的 `measurements`、`outputs`、`connections`。阀门不要在 `valveProfile` 中添加 `role` 或 `function`。

### ProductFact 规格组

`specificationGroups` 用于录规格参数。建议不要让录入人员自由发明 `key`，优先使用已有 key：

- `measurement_range`
- `range`
- `accuracy`
- `overload_limit`
- `output_signal`
- `output`
- `supply_voltage`
- `process_connection`
- `electrical_connection`
- `ingress_protection`
- `wetted_materials`
- `compatible_media`
- `ambient_temperature`
- `media_temperature`
- `feature`

规格值示例：

```json
{
  "key": "mechanical",
  "label": "Mechanical",
  "values": [
    {
      "key": "process_connection",
      "label": "Process connection",
      "value": "G1/4",
      "display": "G1/4"
    }
  ]
}
```

## ResourceUpload（资料中心内容）

用途：给资料中心提供一个简单上传入口。编辑人员只选择业务板块、上传封面/附件/视频并填写说明，不需要理解 `DocumentAsset`、`ProductManual`、`BlogPost` 或 `CaseStudy` 的底层结构。

必填：

- `uploadId`：`upload_` 开头，例如 `upload_company_brochure_2026`。
- `section`：选择所属板块。
- `title`：本地化标题。

建议填写：

- `summary`：本地化摘要。
- `body`：正文说明 JSON 或文本。
- `coverImage`：封面图。
- `attachment`：PDF、图片或下载文件。
- `video`：视频文件。
- `externalUrl`：外部链接，只有在文件不上传到 CMS 时填写。
- `ctaLabel`：按钮文字。
- `publishedOn`、`priority`：发布时间和排序。

同一板块可以持续发布多条资料；每条 `ResourceUpload` 都会获得独立详情页，并按 `priority` 从小到大排序。

资料中心六个主板块映射：

| 后台 `section` | 前台板块 | 前台页面 |
| --- | --- | --- |
| `product-manuals` | 产品手册 | `/resources/manuals/product-manuals` |
| `iot-application-cases` | 物联网应用案例 | `/resources/cases/iot-application-cases` |
| `technical-knowledge` | 技术知识 | `/resources/blog/technical-knowledge` |
| `oem-cases` | OEM 案例 | `/resources/cases/oem-cases` |
| `company-materials` | 公司资料 | `/resources/manuals/company-materials` |
| `engineering-blog` | 博客 | `/resources/blog/engineering-blog` |

公司资料下的两个固定详情入口：

| 后台 `section` | 前台详情 | 前台页面 |
| --- | --- | --- |
| `company-brochure` | 公司宣传册 | `/resources/manuals/company-materials/company-brochure` |
| `quality-certification` | 质量认证 | `/resources/manuals/company-materials/quality-certification` |

录入规则：

- 固定板块内容优先使用 `ResourceUpload`，不要再为了这些页面新建相近 `manualId`、`caseId` 或 `postId`。
- 每条资料的封面、附件、视频、外链，以及产品、行业、应用关联都会映射到对应的前台资料详情。
- 上传封面图填 `coverImage`，上传 PDF/文件填 `attachment`，上传视频填 `video`。
- 只把 `externalUrl` 用于外部文件或外部视频；本地上传文件时不要同时填外部链接。
- 同一板块可持续发布多条资料；使用 `priority` 控制先后顺序，不需要保留或覆盖单一“主记录”。

## CompanyPage（公司页面内容）

用途：维护官网公司页 `/company` 顶部文案、右侧主图和公司介绍视频。这里只管公司页首屏，不要在这里上传资料中心文件。

必填：

- `pageId`：公司页固定填写 `company_about`。
- `pageKind`：选择 `about`。
- `title`：公司页首屏主标题。

建议填写：

- `summary`：公司页首屏标题下方简介。
- `body`：左侧蓝线引用区的公司说明。
- `heroImage`：右侧图片区封面图；如果也上传视频，会作为视频封面。
- `heroVideo`：右侧媒体区的公司介绍视频，前台会显示原生播放控件，可全屏播放。
- `priority`：默认 `100` 即可。

页面位置映射：

| 后台字段 | 前台位置 | 前台页面 |
| --- | --- | --- |
| `title` | 公司页首屏主标题 | `/company` |
| `summary` | 公司页首屏主标题下方简介 | `/company` |
| `body` | 公司页左侧蓝线引用说明 | `/company` |
| `heroImage` | 公司页右侧图片/视频封面 | `/company` |
| `heroVideo` | 公司页右侧视频播放区 | `/company` |

录入规则：

- 公司页只维护一条 `pageId=company_about` 的记录。
- 如果上传 `heroVideo`，前台右侧优先显示视频；没有视频时显示 `heroImage`；两者都没有时显示代码内置默认公司图。
- 视频建议使用 MP4/H.264，控制在 200MB 以内；生产环境同时确认 `STRAPI_UPLOAD_MAX_FILE_SIZE` 和 `STRAPI_UPLOAD_SIZE_LIMIT`。
- 公司宣传册、质量认证、产品手册、案例、博客仍然去 `ResourceUpload（资料中心内容）` 上传，不要放到 CompanyPage。

## DocumentAsset

用途：统一维护产品文档和产品图片/媒体。

### 产品图片录入

创建 `DocumentAsset`：

- `factId`：`asset_` 开头，例如 `asset_yf_p100_primary`。
- `assetClass`：选择 `media`。
- `assetKind`：选择 `primary-image` 或 `gallery-image`。
- `alt`：图片替代文本，例如 `YF-P100 pressure transmitter product image`。
- `hrefOverride`：可直接填写图片路径。
- `file`：也可以上传图片文件。

路径规则：

- 如果先有静态路径，填 `hrefOverride` 即可。
- 后续补上传文件时可以填 `file`。
- 如果 `hrefOverride` 和 `file` 同时存在，系统优先使用 `hrefOverride`。

### 产品文档录入

创建 `DocumentAsset`：

- `factId`：`doc_` 开头，例如 `doc_yf_p100_datasheet`。
- `assetClass`：选择 `document`。
- `title`：文档标题。
- `documentKind`：选择 `datasheet`、`manual`、`certificate`、`drawing`、`catalog` 或 `software`。
- `hrefOverride`：可直接填写 PDF/文件路径。
- `file`：也可以上传文件。
- `locale`：例如 `en`、`zh`、`ru`、`es`、`multi`。
- `revision`：例如 `v1`、`2026-07`。

路径规则同图片：`hrefOverride` 优先于 `file.url`。

### ProductFact 中如何关联

- 文档资产：在 ProductFact 的 `documents` 关系中选择 `assetClass=document` 的 DocumentAsset。
- 图片资产：在 ProductFact 的 `assets` 关系中选择 `assetClass=media` 的 DocumentAsset。

## Certification

用途：维护认证枚举和显示名。

必填：

- `code`：选择枚举值，例如 `ce`、`rohs`、`iso9001`。
- `label`：本地化显示名。

可选：

- `issuer`：认证机构。

录入规则：

- ProductFact 通过 `certifications` 关系选择认证。
- 认证只作为事实标签，不产生独立前台页面。

## BlogPost

用途：维护博客文章入口、列表和详情内容。

必填：

- `postId`：`blog_` 开头。
- `title`：标题。
- `body`：JSON 正文。
- `topic`：主题分类。

建议填写：

- `excerpt`：摘要。
- `authorName`：作者名。
- `publishedOn`：发布日期。
- `heroImage`：文章头图。
- `relatedProducts`、`relatedCategories`、`relatedIndustries`、`relatedApplications`：关联事实。
- `intentPhrases`：关联搜索意图词。

`body` JSON 推荐模板：

```json
{
  "blocks": [
    {
      "type": "paragraph",
      "text": {
        "en": "Write the opening paragraph here.",
        "zh": "在这里填写开头段落。"
      }
    },
    {
      "type": "heading",
      "level": 2,
      "text": {
        "en": "Selection notes",
        "zh": "选型说明"
      }
    },
    {
      "type": "list",
      "items": [
        {
          "en": "Use pressure range as the first screening condition.",
          "zh": "优先按压力范围筛选。"
        }
      ]
    }
  ]
}
```

## CaseStudy

用途：维护案例入口、列表和详情内容。

必填：

- `caseId`：`case_` 开头。
- `title`：案例标题。

建议填写：

- `summary`
- `challenge`
- `solution`
- `outcome`
- `body`
- `region`
- `projectYear`
- `isPublic`
- `heroImage`
- `products`
- `industries`
- `applications`
- `supportingDocuments`
- `intentPhrases`

`body` JSON 推荐模板：

```json
{
  "blocks": [
    {
      "type": "section",
      "title": {
        "en": "Project background",
        "zh": "项目背景"
      },
      "text": {
        "en": "Describe the customer context and operating condition.",
        "zh": "描述客户场景和工况。"
      }
    },
    {
      "type": "section",
      "title": {
        "en": "Result",
        "zh": "结果"
      },
      "text": {
        "en": "Describe measured outcome or operational improvement.",
        "zh": "描述可核实的结果或运行改善。"
      }
    }
  ]
}
```

录入规则：

- `supportingDocuments` 优先选择 `assetClass=document` 的 DocumentAsset。
- 案例不要手写 URL、SEO 或 JSON-LD。

## ProductManual

用途：维护产品手册入口和下载关系。

必填：

- `manualId`：`manual_` 开头。
- `title`：手册标题。
- `manualKind`：手册类型。
- `locale`：`en`、`zh`、`ru`、`es` 或 `multi`。
- `revision`：版本。

建议填写：

- `effectiveDate`
- `document`：选择 `assetClass=document` 且 `documentKind=manual` 的 DocumentAsset。
- `products`：选择相关 ProductFact。
- `relatedCategories`
- `intentPhrases`
- `notes`

录入顺序建议：

1. 先在 DocumentAsset 里建 `doc_` 文档资产。
2. `hrefOverride` 填路径，或者上传 `file`。
3. 在 ProductManual 里选择这个 DocumentAsset。
4. 再关联产品或分类。

公司资料固定入口：

| 用途 | DocumentAsset `factId` | ProductManual `manualId` | 前台详情页 |
| --- | --- | --- | --- |
| 公司宣传册 | `doc_company_brochure` | `manual_company_brochure` | `/resources/manuals/company-materials/company-brochure` |
| 质量认证 | `doc_quality_certification` | `manual_quality_certification` | `/resources/manuals/company-materials/quality-certification` |

这两个 `manualId` 是固定映射。后台发布后，前台公司页和资料中心按钮会继续指向同一详情页，不要另建相近 ID。

## IndustryEcosystemRecommendation

用途：人工维护行业场景下的产品组合推荐。

必填：

- `recommendationId`：`eco_` 开头。
- `title`：推荐标题。
- `recommendationOrder`：JSON 排序清单。

建议填写：

- `rationale`：推荐理由。
- `industry`：所属行业。
- `applications`：应用场景。
- `anchorProduct`：核心产品。
- `recommendedProducts`：推荐产品集合。
- `curationNotes`：内部维护说明。
- `curatedBy`
- `reviewedAt`
- `intentPhrases`

`recommendationOrder` JSON 推荐模板：

```json
[
  {
    "productFactId": "prd_yf_p100",
    "rank": 1,
    "label": "Primary pressure measurement",
    "note": "Use as the anchor pressure transmitter for pump monitoring."
  },
  {
    "productFactId": "prd_yf_sv15",
    "rank": 2,
    "label": "Line isolation valve",
    "note": "Use for water line isolation around the pump skid."
  }
]
```

录入规则：

- `recommendationOrder[].productFactId` 必须也出现在 `recommendedProducts` 关系里。
- `rank` 不要重复。
- 这是人工精选内容，不进入 ProductFact facts API 顶层输出。

## IntentPhrase

用途：维护搜索、SEO 规划和 GEO 答案规划共用的意图词库。这里只存词和关系，不存生成后的 SEO/GEO 内容。

必填：

- `phraseId`：`intent_` 开头。
- `phrase`：实际搜索词或意图短语。
- `locale`：`en`、`zh`、`ru` 或 `es`。
- `intentType`：意图类型。
- `usageSurfaces`：JSON 数组。
- `source`：来源。
- `status`：状态。

建议填写：

- `priority`：数字越小越优先，默认 100。
- `products`
- `categories`
- `industries`
- `applications`
- `notes`

`usageSurfaces` JSON 推荐模板：

```json
[
  "search",
  "seo-planning",
  "geo-planning"
]
```

其他可用示例：

```json
[
  "search",
  "manual-discovery",
  "case-discovery"
]
```

录入规则：

- 同一语言下不要重复录入完全相同的 phrase。
- 不要在 phrase 里写 URL、canonical、SEO 标题或 GEO 答案。
- `status=candidate` 适合待验证词，`active` 适合已确认词，`deprecated` 适合废弃词。

## 快速录入流程

### 录入新产品

1. 确认 CategoryFact 已存在。
2. 确认需要的 IndustryFact 和 ApplicationFact 已存在。
3. 创建 ProductFact。
4. 选择 `family`。
5. 填通用必填字段。
6. 如果是传感器，补 `measurements` 和 `outputs`。
7. 如果是阀门，补 `valveProfile`。
8. 填 `specificationGroups`。
9. 如有资料，先建 DocumentAsset，再回到 ProductFact 关联 `documents` 或 `assets`。
10. 如有认证，关联 Certification。

### 录入产品图片

1. 创建 DocumentAsset。
2. `factId` 用 `asset_`。
3. `assetClass=media`。
4. `assetKind=primary-image` 或 `gallery-image`。
5. 填 `hrefOverride` 或上传 `file`。
6. 填 `alt`。
7. 回到 ProductFact，在 `assets` 中关联这条 DocumentAsset。

### 录入产品文档

1. 创建 DocumentAsset。
2. `factId` 用 `doc_`。
3. `assetClass=document`。
4. `documentKind=datasheet`、`manual` 或 `certificate`。
5. 填 `title`。
6. 填 `hrefOverride` 或上传 `file`。
7. 如有语言和版本，填 `locale`、`revision`。
8. 回到 ProductFact，在 `documents` 中关联这条 DocumentAsset。
9. 如果是手册，再创建 ProductManual 并关联同一条 DocumentAsset。

### 录入博客

1. 创建 BlogPost。
2. `postId` 用 `blog_`。
3. 填 `title`、`topic`、`body`。
4. 按需填 `excerpt`、`authorName`、`publishedOn`、`heroImage`。
5. 关联产品、分类、行业、应用和意图词。

### 录入案例

1. 创建 CaseStudy。
2. `caseId` 用 `case_`。
3. 填 `title`、`summary`、`challenge`、`solution`、`outcome`。
4. 按需填 `body`、`region`、`projectYear`、`isPublic`、`heroImage`。
5. 关联产品、行业、应用、支持文档和意图词。

### 录入行业生态搭配

1. 创建 IndustryEcosystemRecommendation。
2. `recommendationId` 用 `eco_`。
3. 填 `title`、`industry` 或 `applications`。
4. 选择 `anchorProduct` 和 `recommendedProducts`。
5. 按模板填写 `recommendationOrder`。
6. 填 `rationale` 和 `curationNotes`。

## 后续建议做自定义组件的地方

当前可以人工维护，但以下字段对非技术人员不够友好，建议后续用自定义组件或 lifecycle 校验降低填错率：

- `BlogPost.body`
- `CaseStudy.body`
- `IndustryEcosystemRecommendation.recommendationOrder`
- `IntentPhrase.usageSurfaces`
- `ProductFact.specificationGroups`
- `ProductFact.environmentalLimits.wettedMaterials`
- `ProductFact.environmentalLimits.compatibleMedia`
- `ProductFact.valveProfile.compatibleMedia`

这些优化应只改善后台录入体验，不改变 facts API 输出结构，不让 CMS 变成第二套 Domain。
