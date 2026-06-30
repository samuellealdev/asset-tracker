# Tasks: Toggle Deleted Devices

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 180–250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

## Phase 1: Component Foundation (TDD — test first)

### Task 1.1 Add DeviceGridCard optional action mode
- **Test**: `DeviceGridCard` renders only "Details" button when `onDelete` and `onEdit` are undefined
- **Test**: Backward-compatible: all three buttons render when both handlers are provided
- **Impl**: Make `onDelete` and `onEdit` optional in props interface; conditionally render Edit/Delete buttons

**Files**: `DeviceGridCard.tsx`, `DeviceGridCard.test.tsx`

### Task 1.2 Refactor DeletedDevicesList with toggle and DeviceGridCard
- **Test**: Renders toggle button with count when events exist
- **Test**: Does not render when events is empty
- **Test**: Calls `onToggle` when button clicked
- **Test**: Uses `DeviceGridCard` for each event
- **Test**: Passes correct mapped Device shape (id, name, type, createdAt)
- **Impl**: Accept `showDeleted` and `onToggle` props. Map events to Device shape. Use `DeviceGridCard` in grid layout

**Files**: `DeletedDevicesList.tsx`, `DeletedDevicesList.test.tsx`

## Phase 2: Integration

### Task 2.1 Wire toggle into devices.tsx
- **Test**: Devices page shows toggle button
- **Test**: Section hidden by default
- **Test**: Toggle shows/hides section with animation classes
- **Impl**: Add `showDeleted` state. Pass `<DeletedDevicesList showDeleted={showDeleted} onToggle={() => setShowDeleted(!showDeleted)} />`. Wrap in `overflow-hidden transition-all duration-300` div

**Files**: `devices.tsx`, `devices.test.tsx`

## Phase 3: Cleanup

### Task 3.1 Remove DeletedDeviceCard
- Delete `DeletedDeviceCard.tsx` and `DeletedDeviceCard.test.tsx`
- Verify no imports reference them anywhere

**Files**: `DeletedDeviceCard.tsx` (delete), `DeletedDeviceCard.test.tsx` (delete)

## Phase 4: Verification

### Task 4.1 Run full test suite and build
- `npx vitest run` — all tests pass
- `npx tsc --noEmit` — no type errors
- `npx vite build` — production build succeeds
