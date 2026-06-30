# Design: Trace Table Filters

## Technical Approach

Add `FilterState` (method chip + error toggle + path search) to `TraceTable` via `useState`. Extract `applyFilters` and `countActiveFilters` as pure functions for testability. Filter bar renders above the existing scrollable table. No parent changes — React unmount resets filter state naturally when the modal closes or switches services.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Memoization | None — React 19 compiler handles it | `useMemo` for derived array (proposal) | React 19 compiler auto-optimizes. Manual `useMemo`/`useCallback` is anti-pattern per `react-19` skill |
| Filter state location | `useState` inside `TraceTable` | Lift to `LiveMetrics` or `ServiceDetailCard` | TraceTable is the only consumer. Co-location follows SRP — filtering AND presentation are one concern |
| Filter logic | Pure functions `applyFilters` / `countActiveFilters` above component | Inline inside component or `useMemo` block | Testable without DOM. Pure, no dependencies — trivial to unit-test with array fixtures |
| Method filter values | `const` object + `typeof` pattern | String union type `"ALL" \| "GET" \| ...` | TypeScript `as const` pattern gives runtime access and type safety from single source |
| Filter reset on modal close | Natural React unmount | `useEffect` cleanup or parent `key` prop | When `detailService → null`, the JSX branch unmounts — component state is destroyed. Same for Go↔Node switch (different branches) |
| Active badge visibility | Conditional render when `count > 0` | Always visible with zero | Reduces visual noise when no filters are active |
| Empty filtered state | "No matching requests" message | Hide table entirely | Consistent with existing "No recent requests" pattern — keeps users informed |

## Data Flow

```
LiveMetrics.tsx
  │  traces[] from goDetail/nodeDetail
  ▼
TraceTable({ traces })
  │
  ├─► applyFilters(traces, filterState)  ← pure function
  │         │
  │         ▼ filteredTraces[]
  │
  ├─► countActiveFilters(filterState)    ← pure function
  │
  └─► Render: [Filter Bar] → [Table rows from filteredTraces]

Filter bar flow:
  method chip click → setFilterState(prev => ({ ...prev, method: chipValue }))
  error toggle      → setFilterState(prev => ({ ...prev, errorsOnly: !prev.errorsOnly }))
  path input        → setFilterState(prev => ({ ...prev, pathSearch: e.target.value }))
  clear all         → reset to initial state { method: "ALL", errorsOnly: false, pathSearch: "" }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/components/layout/TraceTable.tsx` | Modify | Add `FilterState` type, `applyFilters`, `countActiveFilters`, filter bar UI, "No matching requests" empty state |
| `web-ui/src/components/layout/__tests__/LiveMetrics.test.tsx` | Modify | Add filter scenarios: method chip toggle, error-only toggle, path search, combo filters, clear-all, empty result |
| `web-ui/src/components/layout/LiveMetrics.tsx` | None | No changes — passes `traces` as before; unmount handles reset |

## Interfaces / Contracts

```typescript
const METHOD_FILTERS = {
  ALL: "ALL",
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

type MethodFilter = (typeof METHOD_FILTERS)[keyof typeof METHOD_FILTERS];

interface FilterState {
  method: MethodFilter;
  errorsOnly: boolean;
  pathSearch: string;
}

type FilterState = typeof FILTER_INITIAL;

// Pure — no hooks, no DOM. Testable with plain arrays.
function applyFilters(traces: RequestTrace[], filters: FilterState): RequestTrace[];
function countActiveFilters(filters: FilterState): number;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (vitest) | `applyFilters` — each filter alone and combined | Call with sample arrays and `FilterState` fixtures; assert output length and content |
| Unit (vitest) | `countActiveFilters` — returns 0, 1, 2, 3 correctly | Call with different `FilterState` variants; assert return value |
| Integration (vitest + RTL) | Filter bar renders and responds to clicks | Render `TraceTable` inside modal (existing pattern); click method chips, toggle error, type in search — verify row count changes |
| Integration (vitest + RTL) | Empty state | Apply filter that matches no rows; assert "No matching requests" rendered |
| Integration (vitest + RTL) | Clear-all resets to full list | Activate multiple filters; click "Clear all"; assert all 15 rows shown |
| Integration (vitest + RTL) | Filters reset on modal close/reopen | Open modal, set filter, close modal, reopen — assert filters reset to initial state |

## Migration / Rollout

No migration required. Client-side only — no backend, schema, or configuration changes.

## Open Questions

- None. All patterns follow existing codebase conventions.
