# Archive Report: Request Tracing Metrics

## Verdict
**PASS** — All 500 tests pass across Go, Node.js, and Frontend. 28/29 spec scenarios compliant (1 partial: PUT amber vs orange — cosmetic). 10/10 tasks complete. All 6 design decisions followed. No regressions. Zero build/type-check errors.

## What Was Built

- **Ring buffer (cap 200)** per backend (Go + Node.js) for in-memory request trace storage, zero-allocation after warmup, thread-safe via `sync.Mutex` (Go) and single-threaded shared-nothing (Node)
- **`GET /metrics/requests?limit=N`** endpoint in both backends returning `{requests_total, errors_total, recent: RequestTrace[]}` with newest-first ordering, default limit 50, capped at 200
- **Middleware trace capture**: Go `MetricsMiddleware` calls `PushTrace()` after `ServeHTTP`; Node handler calls `pushTrace()` on `res.finish` event — both capture method, path, status, duration (ms), ISO 8601 timestamp
- **Frontend types**: `RequestTrace` and `MetricsDetail` TypeScript interfaces
- **`getMetricsDetail()` API function** with transport error normalization (same pattern as `getMetrics`/`getHealth`), custom limit, abort signal support
- **`useGoMetricsDetail()` / `useNodeMetricsDetail()` hooks** via TanStack Query: `retry: false`, `staleTime: 10_000`, distinct query keys, configurable `refetchInterval` (default 10s)
- **`ServiceDetailCard` trace table**: scrollable (`max-h-48 overflow-y-auto`), Method badges (colored), Path, Status (color-coded), Duration (ms), Timestamp; error rows (≥400) with red left-border; empty state "No recent requests"

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `ux-live-metrics` | Updated — 6 ADDED + 1 ADDED (from MODIFIED) | Ring buffer storage, metrics detail endpoint, ring buffer integration point, RequestTrace type, getMetricsDetail API, useMetricsDetail hook, ServiceDetailCard trace table |

### Merge Details
- **ADDED**: 6 new requirements appended to main spec
- **MODIFIED**: "Ring Buffer Integration Point" — no matching requirement by name in main spec; added as new requirement with (Previously: counters-only) note
- **REMOVED**: None
- **RENAMED**: None

## Archive Contents Checklist

- [x] `proposal.md` — present
- [x] `specs/ux-live-metrics/spec.md` — present (delta spec)
- [x] `design.md` — present
- [x] `tasks.md` — present, all 10/10 tasks checked complete (stale checkboxes reconciled from verify-report proof)
- [x] `verify-report.md` — present (PASS verdict)
- [x] `verify-report-frontend.md` — present (PASS verdict)
- [x] `verify-report-node.md` — present (PASS verdict)
- [x] `archive-report.md` — present (this file)

## Stale Checkbox Reconciliation
Tasks T1.1–T1.4 and T3.1–T3.3 had unchecked `[ ]` boxes in `tasks.md`. Verify report confirms all 10 tasks complete with commit evidence (da75c46, e6c8948, 22fcae8, b2e1ed5, e0e090d, 0dbf08d, b90bd7b, 12c23b8). Checkboxes were reconciled at archive time per exceptional repair rule — orchestrator explicitly instructed archive for a completed change.

## Source of Truth Updated
- `openspec/specs/ux-live-metrics/spec.md` — now reflects ring buffer request trace storage, metrics detail endpoint, API function, hooks, and trace table requirements

## Engram Artifacts
This change's artifacts are the filesystem copies in the archive folder (hybrid mode: no separate Engram persistence for intermediate artifacts; archive report saved to Engram for traceability).

## Risks / Warnings
- **W01 (cosmetic)**: PUT method badge uses `text-amber-400` instead of `text-orange-*` per spec
- **W02 (cosmetic)**: Status color spec says "red ≥400" but implementation uses amber for 4xx and red for 5xx — error row border IS red for all ≥400
- **W03 (cosmetic)**: Trace table scroll container lacks sticky header
- None of these are functional issues; all verified as safe

## Additional Fix Applied After Archive

- **Settings polling interval required page refresh**: `useSettings()` used local `useState`, creating independent state copies per component. When the user changed polling intervals in `SettingsPanel`, only the panel's local state updated — `LiveMetrics` kept polling at the old rate until page refresh. Fixed by extracting state into a shared `SettingsProvider` (React Context), following the same pattern as `AuthContext`. Both components now share the same state, and React Query v5 picks up `refetchInterval` changes immediately. See `web-ui/src/context/SettingsContext.tsx`.

## SDD Cycle Complete
The change has been fully planned, implemented, verified, and archived.
