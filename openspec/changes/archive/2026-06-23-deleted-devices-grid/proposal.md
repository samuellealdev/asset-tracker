# Proposal: Move Deleted Devices to Devices Page

## Intent

The Deleted Devices section currently lives on the Dashboard page, which is no longer the right home — the Dashboard shows health/metrics only. Users should see deleted devices alongside active devices on the Devices page, with consistent card styling and a clear visual distinction.

## Scope

### In Scope
- Remove `DeletedDevicesList` from `dashboards.tsx`
- Add a "Deleted Devices" section below the active device grid in `devices.tsx`
- Convert the existing list-based deleted devices to card-based UI (matching `DeviceGridCard` style)
- Deleted device cards: only "Details" button, deletion date, muted styling, "Deleted" badge
- Update existing tests and add new tests

### Out of Scope
- Backend changes (the `getDeletedDevices` API stays unchanged)
- Adding new API endpoints
- Changes to the EventPopup or event creation flow

## Capabilities

### Modified Capabilities
- `web-devices`: Add deleted devices section below active grid
- `web-dashboards`: Remove deleted devices section

## Approach

1. Remove `<DeletedDevicesList />` import and usage from `dashboards.tsx`
2. Refactor `DeletedDevicesList` to render cards instead of list rows, with muted styling (opacity-75), "Deleted" badge, deletion date, and only "Details" action
3. Add the refactored `DeletedDevicesList` to `devices.tsx` route below `DeviceGrid`
4. Create a `DeletedDeviceCard` component variant of the card pattern
5. Update route tests for both dashboards and devices

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/routes/dashboards.tsx` | Modified | Remove DeletedDevicesList import and usage |
| `web-ui/src/routes/devices.tsx` | Modified | Add DeletedDevicesList below DeviceGrid |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modified | Refactor to render cards with deleted styling |
| `web-ui/src/components/devices/DeviceGridCard.tsx` | New | Create DeletedDeviceCard variant |
| Route tests | Modified | Update dashboards + devices tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking dashboards test that mocks DeletedDevicesList | Low | Update the mock reference |
| Cards don't match existing grid styling | Low | Follow DeviceGridCard pattern exactly |

## Rollback Plan

Revert `dashboards.tsx` to re-add `<DeletedDevicesList />`, revert `devices.tsx`, and restore `DeletedDevicesList.tsx` to its list-based rendering.

## Dependencies

- None — pure frontend refactor

## Success Criteria

- [ ] `dashboards.tsx` no longer imports or renders DeletedDevicesList
- [ ] `devices.tsx` shows deleted devices below active grid with "Deleted Devices" heading
- [ ] Deleted device cards show "Details" button only, with muted styling and "Deleted" badge
- [ ] All tests pass
