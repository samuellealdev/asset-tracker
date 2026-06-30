# Tasks: Deleted Devices Visual Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 140–160 |
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
| 1 | DeviceGridCard red styling + tests | PR 1 | Tests included in same commit per work-unit-commits rule |
| 2 | DeletedDevicesList wrapper + skeleton tint + tests | PR 1 | Same PR — total well under 400 lines |

## Phase 1: DeviceGridCard — TDD Red-Green

- [x] 1.1 [RED] `__tests__/DeviceGridCard.test.tsx`: Add tests for `deleted=true` — red badge with Trash2 icon (`bg-red-950/40 text-red-400`), "Deleted:" label (`text-red-400/60`), card classes (`opacity-70 bg-slate-800/80 border-l-red-700/30`), only Details button, Edit/Delete suppressed
- [x] 1.2 [GREEN] `DeviceGridCard.tsx`: Add `deleted?: boolean` prop. When true: render `{Trash2}` + "Deleted" badge, "Deleted:" label, overlay classes, suppress Edit/Delete. Default `false` keeps existing behavior unchanged.
- [x] 1.3 [VERIFY] Run existing DeviceGridCard tests — confirm all 13 pass with `deleted=false` (default)

## Phase 2: DeletedDevicesList — TDD Red-Green

- [x] 2.1 [RED] `__tests__/DeletedDevicesList.test.tsx`: Add tests — section has `border-l-rose-600/40` and `from-red-950/15` gradient; skeleton grid receives `[&>div]:bg-red-950/10` className; cards show red "Deleted" badge not indigo type
- [x] 2.2 [GREEN] `DeletedDevicesList.tsx`: Replace section classes with `border-rose-700/20 bg-gradient-to-br from-red-950/15 via-transparent to-transparent border-l-2 border-l-rose-600/40`. Pass `deleted={true}` to `<DeviceGridCard>`. Pass `className="[&>div]:bg-red-950/10 [&>div]:border-red-900/20 [&>div]:opacity-60"` to `<LoadingSkeleton variant="grid">`.
- [x] 2.3 [VERIFY] Run existing DeletedDevicesList tests — confirm toggle, animation, pulse dot, modal unchanged (all 19 pass)

## Phase 3: Verification

- [x] 3.1 Run full test suite: `npx vitest run` — all tests green, zero regressions
- [x] 3.2 Confirm `LoadingSkeleton.tsx` requires zero changes (already supports `className` passthrough)
