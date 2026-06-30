# Tasks: Trace Table Filters

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150-200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — TraceTable.tsx (+80 lines) + tests (+70 lines) |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Filter Types and Pure Functions

- [ ] 1.1 **RED**: Write `applyFilters` unit tests — filter by method (select/deselect/switch), error-only (toggle/combine with method), path search (substring/case-insensitive/empty/combine with method), all 3 combined. Use sample `RequestTrace[]` arrays, no DOM.
- [ ] 1.2 **RED**: Write `countActiveFilters` unit tests — returns 0, 1, 2, 3 for `FilterState` variants.
- [ ] 1.3 **GREEN**: Add `METHODS` const (`as const` pattern) + `FilterState` type to `TraceTable.tsx`.
- [ ] 1.4 **GREEN**: Implement `applyFilters(traces, filters): RequestTrace[]` — chain: method → errorsOnly → path substring (case-insensitive via `.toLowerCase()`).
- [ ] 1.5 **GREEN**: Implement `countActiveFilters(filters): number` — count: method ≠ "ALL" + errorsOnly + pathSearch non-empty.
- [ ] 1.6 **REFACTOR**: Confirm React 19 compiler (no `useMemo`/`useCallback`). Pure functions live above component.

## Phase 2: Filter Bar UI

- [ ] 2.1 **RED**: Write integration test — filter bar renders above table inside modal (verify method chips, error toggle, path input present).
- [ ] 2.2 **RED**: Write integration test — clicking method chip filters rows. Clicking selected chip deselects (all rows shown). Switching chips updates.
- [ ] 2.3 **RED**: Write integration test — error toggle filters to rows with `status >= 400` red-border. Combined: POST + error = only POST errors.
- [ ] 2.4 **RED**: Write integration test — path input filters in real-time. Case-insensitive match works. Clearing restores all rows.
- [ ] 2.5 **RED**: Write integration test — "Clear all" resets every filter; hidden when no filters active.
- [ ] 2.6 **RED**: Write integration test — active count badge shows N when N filters active; hidden at zero.
- [ ] 2.7 **GREEN**: Add `useState<FilterState>` to `TraceTable`. Derive `filteredTraces` via `applyFilters`.
- [ ] 2.8 **GREEN**: Build filter bar: method chips (`inline-flex gap-1`), error toggle (`border-red-500` when active), path input (`bg-slate-800 rounded`), clear-all (`text-xs text-red-400`), badge (`rounded-full bg-blue-500`).
- [ ] 2.9 **GREEN**: Wire `filteredTraces` to existing table body. Preserve existing columns, status colors, and `border-l-2 border-red-500` for error rows.

## Phase 3: Empty State and Reset

- [ ] 3.1 **RED**: Write integration test — "No matching requests" rendered when filters active but `filteredTraces` empty.
- [ ] 3.2 **RED**: Write integration test — "No recent requests" still shown when `traces` array is empty (no filters).
- [ ] 3.3 **RED**: Write integration test — filter state resets when modal closes and reopens (natural unmount).
- [ ] 3.4 **RED**: Write integration test — filter state resets when switching Go→Node service.
- [ ] 3.5 **GREEN**: Add "No matching requests" empty state (conditional: `traces.length === 0` → "No recent requests"; `filteredTraces.length === 0` → "No matching requests").
- [ ] 3.6 **VERIFY**: All existing trace table tests still pass. No code needed for reset — React unmount/remount is sufficient per design.
