# CMS Source Mode Plan

## Scope

This document defines only the source mode switching strategy for `lib/cms/products.ts`.
It does not redefine Strapi schema, aggregator payloads, UI behavior, or the Domain contract.
The backend-only facts API request and response contract is closed in `docs/cms-facts-api-implementation-plan.md`.

## Mode Definitions

| Mode | Purpose | Runtime Behavior | Fallback Role |
|---|---|---|---|
| `mock-domain` | Local safe default | Uses bundled mock products and category tree | Final fallback |
| `env-facts-json` | Deterministic fact replay | Loads `CMS_FACTS_JSON`, validates it as `CmsFactInput`, then builds domain records | First rollback tier |
| `cms-facts-api` | Backend-only integration | Fetches the internal facts endpoint through the async source path when enabled | Primary target for production rollout |

## Switching Strategy

`lib/cms/products.ts` should resolve the active source in a single place and cache the selected snapshot for the process lifetime.

1. Read `CMS_SOURCE_MODE` as the operator intent.
2. Read `CMS_FACTS_JSON` as the deterministic replay source.
3. Read `CMS_FACTS_API_URL`, optional `CMS_FACTS_API_TOKEN`, and related `CMS_FACTS_API_*` variables as readiness signals for the internal endpoint.
4. Select the highest-safe source that is currently usable.
5. Validate the selected payload through `buildDomainFromCmsFacts(cmsFacts)` before exposing domain records.
6. Store the resulting records, category tree, and source metadata together so later calls stay consistent for that process.

## Long-Term Boundary

The three modes have distinct responsibilities and should not collapse into one another:

- `mock-domain` is for bootstrapping, local development, and last-resort safety.
- `env-facts-json` is for reproducible exports, CI validation, and known-good replay.
- `cms-facts-api` is for the backend-only Strapi aggregation path and must remain behind explicit readiness checks.

The adapter must never leak raw facts, partial snapshots, transport details, Strapi envelopes, or wrapper objects to runtime consumers.
Every mode must resolve to a validated direct `CmsFactInput` before `buildDomainFromCmsFacts(cmsFacts)` runs.

## Rollback Order

When the async `cms-facts-api` source is enabled, rollback should follow this order:

1. Try `cms-facts-api`.
2. If the CMS endpoint is unavailable, fails validation, times out, or returns an incompatible shape, fall back to `env-facts-json` when it is present and valid.
3. If `env-facts-json` is missing or invalid, fall back to `mock-domain`.
4. If both higher tiers fail, keep `mock-domain` as the safe operating state and surface operational metadata only.

Rollback is a source selection concern, not a domain concern.
The chosen fallback must be revalidated through the adapter before it becomes active.

## Operational Rules

- Source mode changes are process-level decisions; they do not mutate the Domain contract.
- The requested mode may differ from the active mode when readiness checks fail.
- `cms-facts-api` should only become active when the endpoint is configured, fetch is explicitly enabled, and the fetched body normalizes to direct `CmsFactInput`.
- `CMS_FACTS_API_TOKEN` is server-only transport auth metadata; status output may report whether it is configured, but must not reveal its value.
- If a higher-priority source fails, the adapter should switch to the next available tier without exposing raw upstream data.
- Any source failure should be represented as metadata and logs, not by changing the domain shape.
- A successful `cms-facts-api` HTTP response must normalize to direct `CmsFactInput`, not a Strapi envelope and not a `{ cmsFacts }` wrapper.
- Preview and `publicationState` parameters are backend-only request concerns; they must not create a second source mode or a second payload shape.

## Status Semantics

`getCmsProductStatus()` should report source intent and actual runtime state separately:

- `requestedMode`: what the operator asked for.
- `activeMode`: what the runtime is actually serving.
- `sourceMetadata`: whether `CMS_FACTS_JSON` is configured, whether the CMS facts endpoint is configured, and whether fetch is enabled.
- `factsApiAuthConfigured`: whether server-only bearer auth has been configured for the internal facts endpoint.

This keeps readiness visible while preserving a strict facts-only boundary.

## Non-Goals

- No Strapi schema definition.
- No database connection.
- No UI changes.
- No changes to the Domain contract.
- No duplication of CMS content model or implementation checklist content.
