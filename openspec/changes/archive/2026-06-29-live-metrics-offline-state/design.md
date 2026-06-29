# Design: Live Metrics Offline State

## Technical Approach

Replace the binary `healthy: boolean` in `LiveMetrics` and `HealthDot` with a four-state status model (`"healthy" | "offline" | "unhealthy" | "stale"`). A new pure utility, `classifyHealth()`, maps React Query result tuples `{ isError, data, error }` to one of the four statuses. `HealthDot` maps status to color via a lookup table. The top-bar badge displays the worst-case status across health queries using a priority chain (offline > unhealthy > stale). `ServiceDetailCard` receives a status string instead of a boolean. No hooks, API clients, or backend are touched.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `classifyHealth` location | `web-ui/src/lib/utils/health-status.ts` | Pure function, aligns with `format.ts`/`cn.ts` in the same directory; zero framework dependencies |
| `TypeError` detection fallback | `instanceof TypeError` OR `error?.message?.includes('fetch')` | Proposal mitigation: bundler/iframe cross-realm `instanceof` may fail; string match is a safe fallback |
| Badge scope | Health queries only (goHealth, nodeHealth) | Proposal explicitly scopes metrics out. Metrics queries lack `status` fields and serve a different UX purpose (counters) |
| `ServiceDetailCard` interface | Change `healthy: boolean` → `status: HealthStatus` | Minimal interface change; no new component needed |
| Component tree | Zero new components, modifications to existing | Proposal scope: modify only |

## Data Flow

```
goHealth result (UseQueryResult)    nodeHealth result
       │                                     │
       ▼                                     ▼
 classifyHealth({isError, data, error}) classifyHealth(...)
       │                                     │
       ├── goStatus: "healthy"|...    ── nodeStatus: "healthy"|...
       │                                     │
       ▼                                     ▼
  HealthDot(status={goStatus})      HealthDot(status={nodeStatus})
       │                                     │
       └────── Badge = worst(goStatus, nodeStatus) ──────┘
                        priority: offline > unhealthy > stale

(metrics queries feed counters independently — unchanged)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/lib/utils/health-status.ts` | Create | Export `HealthStatus` type and `classifyHealth()` pure function |
| `web-ui/src/lib/utils/health-status.test.ts` | Create | Unit tests: healthy, offline (TypeError + fallback), unhealthy, stale |
| `web-ui/src/components/layout/LiveMetrics.tsx` | Modify | Replace `healthy` booleans with status strings; priority badge; pass status to `HealthDot` and `ServiceDetailCard` |
| `web-ui/src/components/layout/__tests__/LiveMetrics.test.tsx` | Modify | Add offline/unhealthy/stale mock scenarios; test badge priority |

## Interfaces / Contracts

```typescript
// web-ui/src/lib/utils/health-status.ts
type HealthStatus = "healthy" | "offline" | "unhealthy" | "stale";

interface ClassifyHealthInput {
  isError: boolean;
  data?: { status: string };
  error: unknown;
}

function classifyHealth(input: ClassifyHealthInput): HealthStatus;
// Logic:
//   !isError && data?.status === "ok"     → "healthy"
//   isError && (error instanceof TypeError) → "offline"
//   isError && error?.message?.includes("fetch") → "offline" (fallback)
//   isError && data !== undefined         → "stale"
//   isError (no data, non-TypeError)      → "unhealthy"

// HealthDot (in LiveMetrics.tsx)
function HealthDot({ status, label }: { status: HealthStatus; label: string });
// Color map: healthy=bg-green-500, stale=bg-amber-400, unhealthy=bg-red-500, offline=bg-gray-500
// aria-label: "{label} {status}" e.g. "Go API healthy"

// ServiceDetailCard (in LiveMetrics.tsx)
interface ServiceDetailProps {
  status: HealthStatus;  // was: healthy: boolean
  requests: number | undefined;
  errors: number | undefined;
  lastRefresh: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `classifyHealth()` — all 4 states + `instanceof` boundary | `vitest`: pure function, no mocking; test TypeError, error object with `message`, stale cache, happy path |
| Unit | `classifyHealth()` — message-fallback for cross-realm | `vitest`: construct plain object `{ message: "fetch failed" }` to simulate non-instanceof scenario |
| Component | `HealthDot` color mapping per status | `vitest` + `@testing-library/react`: mock hooks per status, assert CCN classes on dot element |
| Component | Badge priority (offline > unhealthy > stale) | Mock goHealth=offline, nodeHealth=unhealthy → assert only "Offline" badge appears |
| Component | `ServiceDetailCard` status labels | Click modal button, assert "Healthy"/"Unhealthy"/"Offline"/"Stale" text |

## Migration / Rollout

No migration required. Pure frontend change. Rollback: revert `LiveMetrics.tsx` + test to HEAD~, delete `health-status.ts`.

## Open Questions

None.
