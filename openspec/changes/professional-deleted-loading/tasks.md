# Tasks: Professional Loading State for Deleted Devices

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~100 (2 source files + 2 test files) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | LoadingSkeleton grid variant + DeletedDevicesList integration | Single PR | Under budget; tests included |

## Phase 1: LoadingSkeleton Grid Variant (Foundation)

> TDD: RED → GREEN → REFACTOR for `LoadingSkeleton.tsx`

- [x] 1.1 **RED** — Write failing tests in `web-ui/src/components/shared/__tests__/LoadingSkeleton.test.tsx`: grid variant renders correct `count` of card skeletons with `role="status"`, grid variant container has `grid` responsive classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), default variant behavior unchanged. Run `npx vitest run` to confirm RED.
- [x] 1.2 **GREEN** — Extend `LoadingSkeleton.tsx` interface: add `variant?: "rows" | "grid"` (default `"rows"`) and `count?: number`. When `variant="grid"`, render `count` skeleton cards inside `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Each card uses `rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm` container, with inner `bg-slate-700/50 animate-pulse` bars (title `w-3/4 h-6`, badge `w-20 h-5`, date `w-32 h-3 mt-3`, button `w-16 h-8 mt-4 pt-3 border-t border-slate-700`). Cards get `role="status" aria-label="Loading"`. Run `npx vitest run` to confirm GREEN.
- [x] 1.3 **VERIFY** — Confirm all existing `LoadingSkeleton` tests still pass (`npx vitest run src/components/shared/__tests__/LoadingSkeleton.test.tsx`). Backward-compatible: no existing callers use new props.

## Phase 2: DeletedDevicesList Refresh Skeleton (Core)

> TDD: RED → GREEN → REFACTOR for `DeletedDevicesList.tsx`

- [x] 2.1 **RED** — Write failing test in `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx`: mock `useDeletedDevices` with `{ data: baseEvents, isFetching: true }`, assert skeleton cards (role="status") appear inside grid container, toggle button remains visible with stale count, no SVG spinner in button, real cards absent. Flip to `isFetching: false`, assert real cards present, skeleton absent. Run `npx vitest run` to confirm RED.
- [x] 2.2 **GREEN** — In `DeletedDevicesList.tsx`, inside the `events.length > 0` branch: when `isFetching`, render `LoadingSkeleton variant="grid" count={events.length}` inside the grid container div instead of `DeviceGridCard` components. Remove the inline SVG spinner (`{isFetching && <svg>...</svg>}`) from the toggle button. Run `npx vitest run` to confirm GREEN.
- [x] 2.3 **VERIFY** — Confirm all existing `DeletedDevicesList` tests still pass (`npx vitest run src/components/devices/__tests__/DeletedDevicesList.test.tsx`). Backward-compatible: toggle mechanics, modal, error, empty, and hidden states unchanged.

## Phase 3: Verification

- [x] 3.1 Run `npx tsc --noEmit` from `web-ui/` — zero type errors.
- [x] 3.2 Run full test suite: `npx vitest run` from `web-ui/` — all green.
- [x] 3.3 Run `npx vite build` from `web-ui/` — clean production build.
