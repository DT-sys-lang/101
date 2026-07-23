# Final Deployment Architecture

This architecture is the accepted deployment target for the pre-test, staging, and production launch phases.

## Objective

The site is an industrial B2B official website for overseas buyers, engineers, OEM customers, distributors, and AI/search discovery. It must support product selection, technical resource access, SEO/GEO visibility, inquiry conversion, and ongoing Strapi-driven content operations with low maintenance overhead.

## Architecture

```mermaid
flowchart TD
  SEARCH["Google / AI Search"] --> VERCEL["Vercel CDN"]
  BUYER["Overseas Buyers / Engineers"] --> VERCEL
  VERCEL --> NEXT["Next.js 16 Official Site<br/>SSR / ISR / API Routes"]

  NEXT --> SEO["SEO / GEO Runtime"]
  SEO --> ADAPTER["Adapter Layer"]
  ADAPTER --> DOMAIN["Domain Layer<br/>slugs / canonical / sitemap / JSON-LD / GEO"]

  NEXT --> API["API Routes"]
  API --> INQUIRY["Inquiry API"]
  API --> STATUS["CMS Status / Product Feed / Revalidate"]

  INQUIRY --> INTERNAL["Internal CMS API<br/>server-to-server token"]
  STATUS --> INTERNAL
  NEXT --> FACTS["CMS Facts API<br/>server-to-server token"]

  subgraph VPS["BaoTa / VPS"]
    NGINX["Nginx + SSL<br/>cms.example.com"]
    subgraph COMPOSE["Docker Compose"]
      STRAPI["Strapi CMS 5<br/>Admin + Internal APIs"]
      PG["PostgreSQL<br/>industrial_cms"]
      BACKUP["Backup Job<br/>daily pg_dump"]
    end
    NGINX --> STRAPI
    STRAPI --> PG
    BACKUP --> PG
    BACKUP --> BACKUPVOL["Backup Volume"]
  end

  INTERNAL --> NGINX
  FACTS --> NGINX

  STRAPI --> STORAGE["Object Storage<br/>R2 / OSS / COS / S3"]
  STORAGE --> NEXT
  STORAGE --> DATASHEET["Images / PDF / Datasheets / Certificates"]

  STRAPI --> REVALIDATE["Next Revalidate Webhook"]
  REVALIDATE --> NEXT

  MONITOR["Monitoring / Smoke Checks"] --> NEXT
  MONITOR --> NGINX
  MONITOR --> FACTS
  MONITOR --> BACKUP
```

## Boundaries

- Strapi owns editorial facts, inquiry records, PostgreSQL data, and media references.
- Strapi does not own generated slugs, canonical paths, SEO, JSON-LD, GEO payloads, or product domain identity.
- The adapter/domain layers generate and validate frontend-facing product records, SEO, GEO, sitemap, hreflang, and structured data.
- Internal CMS routes are server-to-server only and must use shared tokens.
- Vercel serves the public website. BaoTa/VPS serves the private CMS runtime behind Nginx.
- Object storage is the durable source for product images, manuals, certificates, PDFs, and datasheets.
- PostgreSQL backups must not exist only inside the active database volume; they must be exported and copied off the server during production operations.

## Pre-Test Target

The pre-test deployment must prove:

- `preview.example.com` can render the Next.js site from Vercel.
- `cms.example.com/admin` can load Strapi through BaoTa/Nginx.
- `preview.example.com` can read protected Strapi facts through server-side token config.
- Inquiry submissions are persisted to Strapi `inquiry-submission`.
- Media uploads resolve from object storage.
- ISR/revalidate works after Strapi publish events.
- Smoke checks pass for website, CMS, sitemap, robots, inquiry contract, and facts API.
