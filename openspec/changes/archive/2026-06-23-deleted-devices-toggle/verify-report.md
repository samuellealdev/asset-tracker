## Verification Report

**Change**: Toggle Deleted Devices
**Mode**: Standard (Strict TDD)
**Verdict**: PASS

### Completeness

| Phase | Tasks | Status |
|-------|-------|--------|
| Component Foundation | 1.1–1.2 | ✅ 2/2 complete |
| Integration | 2.1 | ✅ 1/1 complete |
| Cleanup | 3.1 | ✅ 1/1 complete |
| Verification | 4.1 | ✅ 1/1 complete |

### Build / Tests / Coverage

| Check | Result | Details |
|-------|--------|---------|
| TypeScript build | ✅ PASS | `tsc --noEmit` clean |
| Vite production build | ✅ PASS | Builds in 3.44s |
| Unit tests | ✅ PASS | 320/324 passed (4 pre-existing timeouts unchanged) |
| New tests | ✅ PASS | 7 new tests pass across DeviceGridCard and DeletedDevicesList |

### Spec Compliance Matrix

| Spec Scenario | Status | Evidence |
|---------------|--------|----------|
| Section hidden by default | ✅ PASS | `showDeleted` defaults to `false` |
| Toggle button with count | ✅ PASS | Button shows "Show deleted devices (N)" |
| Toggle shows section | ✅ PASS | Section slides in with `max-h-[5000px] opacity-100` |
| Toggle hides section | ✅ PASS | Button text changes to "Hide deleted devices" |
| Identical card styling | ✅ PASS | Uses `DeviceGridCard` with no opacity/badge |
| Only Details action | ✅ PASS | `onDelete`/`onEdit` undefined → buttons not rendered |
| Details navigates to /devices/$id | ✅ PASS | `useNavigate` with correct params |
| No deleted devices — empty state | ✅ PASS | "No deleted devices" shown |
| Loading — skeleton | ✅ PASS | LoadingSkeleton rendered |
| Error — retry button | ✅ PASS | Error + retry rendered |
| `DeletedDeviceCard.tsx` removed | ✅ PASS | File deleted, no imports remain |

### Issues

None.

### Verdict

**PASS** — All tasks implemented, all tests pass, specs satisfied, design followed.

---

## Post-Archive Fix: Bug 1 (Unknown type) & Bug 2 (Device not found)

**Date**: 2026-06-23
**Commit**: `fix(web-ui): show deleted device info in modal instead of 404, fix 'Unknown' type`

### Bug 1 — Type shows "Unknown"

**Root cause**: `mapEventToDevice` in `DeletedDevicesList.tsx` hardcoded `type: "Unknown"` because MongoDB events don't store the device type.

**Fix**: Changed hardcoded type from `"Unknown"` to `"Deleted"` — semantically correct and informative.

### Bug 2 — Details shows "Device not found"

**Root cause**: The Details button on deleted device cards navigated to `/devices/$id`, which hits the PostgreSQL API. Since the device was hard-deleted, `GET /devices/$id` returns 404.

**Fix**: Added optional `onDetails` prop to `DeviceGridCard`. When provided, it's called instead of navigating. `DeletedDevicesList` passes `onDetails` that opens a Modal with the event data (name, device ID, deletion timestamp, optional actor/description).

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `web-ui/src/components/devices/DeviceGridCard.tsx` | Modified | Added optional `onDetails` prop; conditional handler checks `onDetails` before navigating |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modified | Changed `type: "Unknown"` → `"Deleted"`; added `onDetails` + Modal with event info |
| `web-ui/src/components/devices/__tests__/DeviceGridCard.test.tsx` | Modified | Added 2 tests: `onDetails` callback behavior, navigation fallback |
| `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx` | Modified | Added 1 test: modal opens with event details on Details click |

### Verification
| Check | Result |
|-------|--------|
| TypeScript | ✅ `tsc --noEmit` clean |
| Unit tests | ✅ 325/327 passed (2 pre-existing timeouts unchanged) |
