# Archive Report: live-metrics-offline-state

**Change**: Live Metrics Offline State  
**Archived to**: `openspec/changes/archive/2026-06-29-live-metrics-offline-state/`  
**Date**: 2026-06-29  
**Verdict**: PASS WITH WARNINGS

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| ux-live-metrics | Updated | Modified Health Indicators (4-state model + 10 scenarios); Added classifyHealth Utility (5 scenarios), HealthDot Component (2 scenarios), ServiceDetailCard Modal (2 scenarios) |

## Archive Contents

| Artifact | Path |
|----------|------|
| proposal.md | ✅ |
| design.md | ✅ |
| tasks.md | ✅ (8/8 tasks complete) |
| verify-report.md | ✅ |
| archive-report.md | ✅ |
| specs/ux-live-metrics/spec.md | ✅ |

## Source of Truth Updated

- `openspec/specs/ux-live-metrics/spec.md` — now reflects 4-state classification, priority badge, and all new components
- `README.md` — Phase 12 added for the change

## Additional Fix Applied During Archive

- **Proxy error misclassification**: `getHealth()` in `health.ts` called `response.json()` before checking `response.ok`. When Vite proxy returned a 502 HTML error page (backend down), `response.json()` threw `SyntaxError` instead of the expected `TypeError`, causing `classifyHealth` to misclassify the state as "unhealthy" (new window) or "stale" (cached window) instead of "offline". Fixed by wrapping both `fetch` and `response.json()` in try/catch, normalizing transport errors to `TypeError` so `classifyHealth` correctly returns "offline". Also added 2 new tests for network error and non-JSON response scenarios (361 tests total). See `web-ui/src/lib/api/health.ts` and `health.test.ts`.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
