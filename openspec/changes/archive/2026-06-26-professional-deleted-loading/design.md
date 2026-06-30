# Design: Professional Loading State for Deleted Devices

## Technical Approach

Extend `LoadingSkeleton` with a `variant="grid"` prop that renders card-shaped skeletons matching `DeviceGridCard` layout. In `DeletedDevicesList`, insert a new conditional branch: when `isFetching && events` (refresh with stale data), show skeleton grid inside the card container instead of real cards. Remove the inline SVG spinner from the toggle button — the skeleton grid IS the feedback.

## Architecture Decisions

### Decision 1: Skeleton variant interface

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `SkeletonGrid` component | Duplicates skeleton logic, diverges from existing pattern | **Reject** |
| `variant` prop on `LoadingSkeleton` | Backward-compatible, single component, single source of animation/pulse | **Choose** |
| Separate `children`-based approach | Overly flexible, no guarantee of matching card layout | **Reject** |

**Choice**: Add `variant?: "rows" \| "grid"` (default `"rows"`) and `count?: number` to `LoadingSkeleton`. When `variant="grid"`, render `count` skeleton cards inside `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Each skeleton card uses `animate-pulse` and `bg-slate-700/50` with element widths mirroring real card content (title bar → badge → date → button row).

**Rationale**: Single component, backward-compatible, matches real card DOM structure to prevent layout shift during transition.

### Decision 2: Conditional rendering flow

**Choice**: Insert `isFetching` check ONLY inside the `events.length > 0` branch (refresh path), NOT in the initial-load path. New logic:

```
isLoading          → LoadingSkeleton rows={3}        (unchanged)
isError            → error + retry                    (unchanged)
no events          → empty state                      (unchanged)
events + isFetching → toggle (stale count) + skel grid (NEW)
events + !isFetching → toggle + real cards             (unchanged)
```

**Rationale**: `isLoading` already covers first-mount with `rows={3}`. `isFetching` only matters when data already exists. TanStack Query keeps `data` populated during refetch, so `events.length` reflects stale count — exactly what we need for the toggle label.

### Decision 3: Spinner removal

**Choice**: Remove the inline SVG spinner (`{isFetching && <svg>...</svg>}`) from the toggle button entirely.

**Rationale**: Spec explicitly requires no spinner in the toggle during refresh. Dual indicators (spinner + skeleton) create cognitive noise. The skeleton grid is unambiguous visual feedback.

### Decision 4: Skeleton card styling

**Choice**: Reuse `DeviceGridCard` container classes exactly: `rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm`. Inner skeleton bars use `rounded bg-slate-700/50 animate-pulse` with widths: title `w-3/4 h-6`, badge `w-20 h-5`, date `w-32 h-3 mt-3`, button row `w-16 h-8 mt-4 pt-3 border-t border-slate-700`.

**Rationale**: Identical container classes and proportional inner widths prevent layout shift. `bg-slate-700/50` matches constraint while maintaining dark theme consistency.

## Data Flow

```
useDeletedDevices() ──→ { data: events, isLoading, isFetching, isError, refetch }
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              isLoading?     isError?     events.length>0?
              rows skeleton   error+retry      │
                                        ┌──────┴──────┐
                                        ▼              ▼
                                   isFetching?    real cards
                                   skel grid
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/components/shared/LoadingSkeleton.tsx` | Modify | Add `variant` and `count` props; render card-shaped skeletons when `variant="grid"` |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modify | Insert `isFetching` skeleton grid branch inside events>0 path; remove SVG spinner from toggle |
| `web-ui/src/components/shared/__tests__/LoadingSkeleton.test.tsx` | Modify | Add tests: grid variant renders correct count of card skeletons, grid variant uses responsive classes, grid variant cards have status role, default variant unchanged |
| `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx` | Modify | Add test: skeleton grid renders during isFetching with stale data; toggle button present but no spinner; remove/add test for spinner absence |

## Interfaces / Contracts

```typescript
// LoadingSkeleton — extended props
interface LoadingSkeletonProps {
  rows?: number;           // existing, used only when variant="rows"
  variant?: "rows" | "grid"; // new, default "rows"
  count?: number;          // new, required when variant="grid"
  className?: string;      // unchanged
}
```

`variant="grid"` ignores `rows`; `variant="rows"` ignores `count`. Mutually exclusive by convention — no runtime enforcement needed.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (LoadingSkeleton) | Grid variant renders `count` card skeletons with `role="status"`; responsive grid classes present; default variant unchanged | `render` + `screen.getAllByRole` + `container.querySelector` grid class assertions |
| Unit (DeletedDevicesList) | Skeleton grid renders when `isFetching=true` and `data` exists; toggle button shows stale count; no SVG spinner in button; real cards render when `isFetching=false` | Mock `useDeletedDevices` with `{ data, isFetching: true }`; assert skeleton cards present, toggle visible, cards absent; flip to `isFetching: false`, assert cards present, skeleton absent |
| TypeScript | No type errors | `npx tsc --noEmit` |

## Migration / Rollout

No migration required. Pure frontend UX change — toggle behavior, data fetching, and card rendering remain unchanged.

## Open Questions

None.
