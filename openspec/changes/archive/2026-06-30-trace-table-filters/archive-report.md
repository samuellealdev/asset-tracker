# Archive Report: trace-table-filters

## Summary

**Change**: trace-table-filters
**Archived to**: `openspec/changes/archive/2026-06-30-trace-table-filters/`
**Date**: 2026-06-30
**Verdict**: ✅ Pass (all 21 tasks complete, 430 tests passing, 24/24 spec scenarios compliant)

## Reconciliation Note

The archived `tasks.md` contains stale checkboxes (`[ ]` for all tasks) due to the SDD workflow tracking
completion externally rather than updating the task file. This is an exceptional mechanical reconciliation
backed by proof from `verify-report.md` (21/21 tasks complete, 0 critical issues, PASS verdict).
The orchestrator explicitly instructed archive, confirming the change is fully implemented.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `ux-live-metrics` | Updated | 1 MODIFIED requirement (ServiceDetailCard Trace Table) + 6 ADDED requirements (Method Filter Chips, Error-Only Toggle, Path Search, Clear All Filters, Active Filter Count Badge, Filter State Reset on Context Change) |

## Archive Contents

| Artifact | Status | Notes |
|----------|--------|-------|
| `proposal.md` | ✅ | Intent, scope, capabilities, risks, rollback plan |
| `specs/` | ✅ | Delta spec for `ux-live-metrics` with ADDED + MODIFIED requirements |
| `design.md` | ✅ | 9 architecture decisions, data flow diagram, interfaces, testing strategy |
| `tasks.md` | ✅ | 21 tasks across 3 phases (stale checkboxes reconciled — see note above) |
| `verify-report.md` | ✅ | 430 tests passed, 0 failures, 0 critical issues, PASS verdict |

## Source of Truth Updated

The following spec now reflects the new behavior:

- `openspec/specs/ux-live-metrics/spec.md` — Merged filter bar requirements into existing trace table requirement + appended 6 new filter requirements

## Architecture Decision Recorded

Added to README Key Architecture Decisions table:

> **Client-side filtering for trace table** — Pure functions `applyFilters`/`countActiveFilters` above the component with no framework deps. `useState` co-located inside `TraceTable` (single consumer, SRP). React unmount destroys state automatically. React 19 compiler handles memoization.

## Additional Fix Applied After Archive

- **Health/metrics endpoints excluded from counters and ring buffer**: `/health*` and `/metrics*` paths were inflating request counters and burying business traffic in the trace table (9/10 traces were infrastructure noise). Both backends now skip these paths in `MetricsMiddleware` (Go) and request handler (Node). Counters and ring buffer now reflect business traffic only. See `go-service/internal/interfaces/metrics_handler.go` and `node-service/src/index.js`.
- **Error row styling changed from left border to subtle red background**: Replaced `border-l-2 border-red-500` with `bg-red-950/20` (red background across entire row) for error traces (status ≥ 400). Path, duration, and timestamp columns also get reddish text (`text-red-300`) on error rows. Visual impact: consistent row-level highlighting instead of a single vertical bar. See `web-ui/src/components/layout/TraceTable.tsx`.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
