# Strapi v5 Production Cutover Continuation

Date: 2026-07-12
Decision: **Conditional Go**. This record strengthens isolated local evidence only. It is not approval to change production traffic, DNS, secrets, databases, or the v4 service.

## Isolated runtime

```text
Database: industrial_cms_v5_locale_phase3_20260712_rehearsal6
PostgreSQL: 127.0.0.1:55432
Strapi v5: http://127.0.0.1:1340
Node: 20.20.2
Strapi: 5.50.1
```

The rehearsal remained isolated from `industrial_cms` and production infrastructure.

## Fresh continuation evidence

- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-continuation-equivalence.json`: `ok: true`, no failures.
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-continuation-api-security.json`: 8/8 API, CORS, and authentication checks passed.
- `tmp/strapi-v5-locale/industrial_cms_v5_locale_phase3_20260712_rehearsal6-continuation-encryption-final-v5-website.json`: 13/13 full-chain website checks passed.

The website check confirmed the live source path `cms-facts-api -> adapter/domain`, with `productCount: 10`. `/en`, `/en/products`, `/en/resources`, `/en/resources/blog`, and `/sitemap.xml` returned HTTP 200. Generic `POST /api/revalidate` returned HTTP 405.

The isolated read-only resources token was created, used, revoked, and then rejected with HTTP 401. No token value or local secret is recorded here.

## Encryption-key remediation

The local v5 rehearsal verified the installed Strapi 5.50.1 configuration shape:

```js
secrets: {
  encryptionKey: env('ENCRYPTION_KEY'),
}
```

The local `ENCRYPTION_KEY` is ignored and has not been printed, copied into reports, or committed. Production secret-manager injection and rotation/revocation evidence remain external gates.

## Browser regression

Local isolated browser regression used `agent-browser` against a Node 20 Next verification server.

| Viewport | Coverage | Result |
| --- | --- | --- |
| Desktop `1440x1000` | `/en`, `/en/products`, `/en/resources` | Content, navigation, and images rendered; no error overlay, horizontal overflow, broken loaded images, or console errors. |
| Mobile `390x844` | `/en`, expanded navigation, `/en/products` | Carousel, navigation, filters, product cards, and footer rendered; no error overlay, horizontal overflow, broken loaded images, or console errors. |

Evidence:

- `tmp/strapi-v5-locale/continuation-desktop-home.png`
- `tmp/strapi-v5-locale/continuation-desktop-products.png`
- `tmp/strapi-v5-locale/continuation-desktop-resources.png`
- `tmp/strapi-v5-locale/continuation-mobile-home.png`
- `tmp/strapi-v5-locale/continuation-mobile-products.png`

This result is **local isolated evidence only**. Browser validation in CI or on an acceptance device remains pending and is still an external production gate.

## Parse-log follow-up

An earlier development-server stderr contained `Unexpected end of JSON input` during page rendering. The only page-rendering `JSON.parse` fallback was reviewed, `outputs/cms-facts.json` parsed with Node 20, and the dedicated transient Next output was removed before restarting the server with Node 20.

After the clean restart, repeated `/en`, `/en/products`, and `/en/resources` requests returned HTTP 200; the parse exception did not reproduce. The clean-restart log showed only a Next development advisory that `/images/hero/industrial-instrumentation.png` was the Largest Contentful Paint image and might need `loading="eager"`. This is nonblocking local development guidance, not performance-validation evidence.

## Remaining production blockers

- DBA-created fresh PostgreSQL-superuser backup with globals, roles, tablespaces, extensions, checksums, and controlled storage.
- Full-chain rehearsal from that protected backup into a new disposable database.
- Production secret-manager injection, including `ENCRYPTION_KEY`, application/admin/JWT/API salts, facts/resources credentials, rotation/revocation evidence, RBAC, and MFA.
- Persistent uploads or object storage, CDN behavior, and media backup/restore validation.
- Production HTTPS/TLS, reverse proxy `X-Forwarded-*`, CORS, request limits, timeouts, rate limits, and cache validation.
- Actual signed webhook delivery, retry and alerting behavior, durable deduplication, and draft-preview expiry/noindex validation.
- Named maintenance-window owners, v4 retention and rollback authority, and business/user approval.
- Browser validation in CI or on an acceptance device, including any required performance validation.

**Conclusion: Conditional Go remains unchanged.** No production cutover is authorized by this continuation record.
