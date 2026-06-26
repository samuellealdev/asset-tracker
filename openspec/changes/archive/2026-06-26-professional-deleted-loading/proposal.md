# Proposal: Professional Loading State for Deleted Devices

## Intent

The Deleted Devices section currently shows only a tiny SVG spinner inside the toggle button when it refreshes after a device deletion (TanStack Query `isFetching`). Users have no visual feedback on the grid area itself — cards either flicker or stay stale until new data arrives with the 5-second Kafka propagation delay. This change replaces the button-only spinner with a professional loading state that covers the entire section, using skeleton cards that clearly communicate "data is refreshing."

## Scope

### In Scope
- Show a skeleton grid in place of device cards when `isFetching` is true and data already exists (refresh)
- Keep toggle button visible with count from stale data during refresh
- Initial load (`isLoading`) already uses `LoadingSkeleton` — keep this behavior unchanged

### Out of Scope
- Backend/API changes
- Changes to toggle mechanics, animation, or card rendering
- Loading states for other sections (active grid, events)

## Capabilities

> Research: `openspec/specs/web-devices/` § Deleted Devices Section (Toggle) — Loading state.

### New Capabilities
None

### Modified Capabilities
- `web-devices`: Extend the "Loading state" scenario to cover both initial load and refresh (isFetching). The skeleton MUST replace the grid content area during refresh, not just show a spinner in the button.

## Approach

1. In `DeletedDevicesList.tsx`, when `isFetching && events` (refresh with existing data), render `LoadingSkeleton` grid variant inside the grid container instead of `DeviceGridCard` components
2. Extend `LoadingSkeleton` with a `variant="grid"` prop that renders card-shaped skeletons in a responsive grid matching `DeviceGridCard` layout
3. Keep the toggle button visible with stale count — no spinner in button during refresh
4. Remove the inline SVG spinner from the toggle button entirely; `isFetching` feedback is now the skeleton grid

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modified | Conditional skeleton grid on isFetching refresh |
| `web-ui/src/components/shared/LoadingSkeleton.tsx` | Modified | Add grid variant prop for card-shaped skeletons |
| `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx` | Modified | New test: skeleton renders during isFetching |
| `web-ui/src/components/shared/__tests__/LoadingSkeleton.test.tsx` | Modified | New test: grid variant renders correct columns |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Grid variant skeleton layout mismatch with real cards | Low | Reuse same Tailwind grid classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) |
| Skeleton flash on fast responses | Low | TanStack Query `staleTime: 30_000` prevents refetch while data is fresh; skeleton only shows on explicit invalidation |

## Rollback Plan

Revert `DeletedDevicesList.tsx` and `LoadingSkeleton.tsx` to previous state. Restore inline SVG spinner in toggle button.

## Dependencies

None — pure frontend UX change.

## Success Criteria

- [ ] When `isFetching` is true and deleted devices data exists, skeleton cards replace the grid content
- [ ] Toggle button remains visible with stale count during refresh
- [ ] Inline SVG spinner removed from toggle button
- [ ] Initial load skeleton behavior unchanged
- [ ] Tests pass (`node --test`), TypeScript clean, Vite build succeeds
