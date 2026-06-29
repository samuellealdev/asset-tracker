# Proposal: Live Metrics Offline State

## Intent

The LiveMetrics top bar lumps all backend errors into one red-dot + amber "Stale" badge — users can't tell if the backend is unreachable (network down), returning unhealthy responses, or just showing stale cached data. This change adds three distinct visual states so operators can triage at a glance.

## Scope

### In Scope
- Create `classifyHealth()` utility: maps React Query result (`isError`, `data`, `error`) → `"healthy" | "offline" | "unhealthy" | "stale"`
- Update `HealthDot` to accept `status` string instead of `healthy` boolean, with color mapping (gray/red/amber/green)
- Replace global amber "Stale" badge with priority-based badge: Offline > Unhealthy > Stale > none
- Update `LiveMetrics.test.tsx` with new test cases for all 4 states
- Update `ServiceDetailCard` modal to reflect the new status classifications

### Out of Scope
- Backend /health endpoint changes
- Metrics endpoint classification (only health queries produce the top-bar badge)
- Changes to polling interval or refetch logic
- HealthDot tooltip content (already shows "Healthy"/"Unhealthy" — classification enriches this)

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `ux-live-metrics`: Health indicators now distinguish `offline` (gray dot + "Offline"), `unhealthy` (red dot + "Unhealthy"), `stale` (amber dot + "Stale"), and `healthy` (green dot, no badge)

## Approach

1. Add `classifyHealth(error: unknown, data?: {status: string})` to `web-ui/src/lib/utils/health-status.ts`:
   - `TypeError` from fetch → offline
   - Thrown `{status, body}` with HTTP status → unhealthy
   - `isError` + `data` still populated (stale cache) → stale
   - `data?.status === "ok"` → healthy
2. Refactor `HealthDot({ status, label })` → 4 colors via `cn()`
3. In `LiveMetrics`, compute `goStatus`/`nodeStatus` instead of `goHealthy`/`nodeHealthy` booleans
4. Compute top-bar badge priority from all 4 query results: offline > unhealthy > stale > none
5. Update 256-line test file: add network-error and HTTP-error mock scenarios, verify dot/badge colors

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/lib/utils/health-status.ts` | New | `classifyHealth()` utility |
| `web-ui/src/components/layout/LiveMetrics.tsx` | Modified | Status-based rendering, priority badge |
| `web-ui/src/components/layout/__tests__/LiveMetrics.test.tsx` | Modified | New test scenarios |
| `web-ui/src/hooks/use-health.ts` | Unchanged | Hooks stay the same |
| `web-ui/src/hooks/use-metrics.ts` | Unchanged | Metrics hooks unchanged |
| `web-ui/src/lib/api/health.ts` | Unchanged | API client unchanged |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| React Query `error` shape differs across versions | Low | `classifyHealth` is a single pure function — easy to adjust if v6 changes the shape |
| `TypeError` not reliably instanceof across iframe/bundler | Low | Add `error?.message?.includes('fetch')` as fallback |
| Stale cache not populated in all React Query configs | Low | Check `data !== undefined`; if no stale data, fall through to offline |

## Rollback Plan

Revert `LiveMetrics.tsx` and its test file to HEAD~. Delete `health-status.ts` if created. No backend or API changes to unwind.

## Dependencies

None — pure frontend component change. Requires no backend or infra changes.

## Success Criteria

- [ ] Green dot + no badge when Go AND Node health queries return `{status: "ok"}`
- [ ] Gray dot + "Offline" badge when any health query fails with network error (TypeError)
- [ ] Red dot + "Unhealthy" badge when backend responds with non-200 status
- [ ] Amber dot + "Stale" badge when query errored but stale cached data exists
- [ ] Badge priority: Offline > Unhealthy > Stale — only one badge shown
- [ ] All 4 states have test coverage in `LiveMetrics.test.tsx`
- [ ] `vitest run` passes, `tsc -b` clean, `vite build` succeeds
