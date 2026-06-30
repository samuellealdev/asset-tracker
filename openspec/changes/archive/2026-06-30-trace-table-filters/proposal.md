# Proposal: Trace Table Filters

## Intent

Operators scanning the ServiceDetailCard trace table must hunt through all rows to find errors or specific HTTP methods. Client-side filters let them narrow the view to error-only traces, specific methods, or endpoint paths — no backend changes.

## Scope

### In Scope
- Filter bar above trace table: method toggle chips (All/GET/POST/PUT/DELETE), error-only toggle, path text search, clear-all link, active count badge
- Client-side filtering on `traces[]` (max 200), state in `TraceTable`
- Combinable filters: e.g. "errors only" + "POST"

### Out of Scope
- Backend changes, filter persistence across modal reopens, server-side pagination, filter presets/export

## Capabilities

### Modified Capabilities
- `ux-live-metrics`: Trace Table requirement gains filter bar with method/error/path controls and active-count badge

## Approach

`useState` hooks for `methodFilter`, `errorOnly`, `pathSearch`. Apply via `useMemo`-derived array. Filter bar renders above scrollable table with: method chips (click toggles, "All" deselects), error toggle (`status >= 400`), path search (case-insensitive substring), clear-all (visible when active), active-count badge, and "No matching requests" empty state. No new dependencies.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/components/layout/TraceTable.tsx` | Modified | Filter state, bar UI, filtering logic |
| `web-ui/src/components/layout/__tests__/LiveMetrics.test.tsx` | Modified | Filter test scenarios |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Filter bar too tall for modal | Low | Compact 1-2 row inline layout |
| 200 items × filters perf | Low | `useMemo`; trivial for client-side |
| Chip interaction unclear | Low | Single-select with documented toggle behavior |

## Rollback Plan

Revert `TraceTable.tsx` and `LiveMetrics.test.tsx` to HEAD~. No backend/schema changes.

## Dependencies

None — depends only on `traces` prop already passed to `TraceTable`.

## Success Criteria

- [ ] Method chips filter table to selected method; "All" restores full view
- [ ] Error-only toggle filters to `status >= 400`
- [ ] Path search filters by case-insensitive substring match
- [ ] Filters combine (e.g., error-only + POST shows POST errors)
- [ ] Active count badge and clear-all behave correctly
- [ ] Empty filtered state shows "No matching requests"
- [ ] All existing tests pass; new tests cover filter controls and logic
