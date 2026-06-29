# Tasks: Live Metrics Offline State

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~275 |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes (force-chained strategy) |
| Suggested split | PR 1 → PR 2 |
| Delivery strategy | force-chained |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `classifyHealth()` utility + unit tests | PR 1 | Pure function, zero deps; base = feature tracker branch |
| 2 | Component updates + component tests | PR 2 | Depends on PR 1 for `HealthStatus` import; base = PR 1 branch |

## Phase 1: classifyHealth Utility (TDD)

- [x] 1.1 RED — Create `web-ui/src/lib/utils/health-status.test.ts`: failing tests for healthy (`data.status="ok"`), offline (`TypeError`), offline fallback (`{message:"fetch failed"}`), unhealthy (HTTP error, no data), stale (error + cached data)
- [x] 1.2 GREEN — Create `web-ui/src/lib/utils/health-status.ts` exporting `HealthStatus` type and `classifyHealth(input)`. Logic: `!isError && data?.status==="ok"` → healthy; `TypeError` or `message.includes("fetch")` → offline; `data !== undefined` → stale; else → unhealthy. Run `npx vitest run` to verify.
- [x] 1.3 REFACTOR — Confirm pure function (no side effects, no framework imports). All 5 spec scenarios pass.

## Phase 2: Component Updates (TDD)

- [x] 2.1 RED — Add test cases to `web-ui/src/components/layout/__tests__/LiveMetrics.test.tsx`: offline dot (TypeError → gray), unhealthy dot (HTTP 503 → red), stale dot (error+cached → amber), badge priority (offline > unhealthy, unhealthy > stale), no badge when all healthy, modal status labels. Tests fail — code still uses booleans.
- [x] 2.2 GREEN — Modify `HealthDot` in `LiveMetrics.tsx`: `healthy: boolean` → `status: HealthStatus`. Color table: healthy=bg-green-500, offline=bg-gray-400, unhealthy=bg-red-500, stale=bg-amber-400. Update `aria-label` and `title` per spec.
- [x] 2.3 GREEN — Modify `ServiceDetailCard` interface: `healthy: boolean` → `status: HealthStatus`. Render correct dot color and label text for all 4 states.
- [x] 2.4 GREEN — Replace top-bar badge: compute `goStatus = classifyHealth(goHealth)` and `nodeStatus = classifyHealth(nodeHealth)`. Priority chain (offline > unhealthy > stale). No badge when both healthy. Remove old `hasError` variable and single amber "Stale" badge.
- [x] 2.5 REFACTOR — Run `npx vitest run`. Verify all 10+ new spec scenarios pass. Ensure existing counter/metrics tests remain green. Remove dead code.
