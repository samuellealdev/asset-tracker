# Proposal: Toggle Deleted Devices Section

## Intent

Deleted devices currently render as a fixed section below the active grid with visually muted cards (opacity, "Deleted" badge). Users who don't need to see deleted devices have no way to hide them, and the muted styling makes them harder to read when they are needed. Instead: hide the section by default, let users toggle it on demand, and render deleted devices with identical card styling to active ones — no visual penalties, no badges.

## Scope

### In Scope
- Replace `DeletedDeviceCard` with `DeviceGridCard` (no opacity/badge)
- `DeviceGridCard`: make `onDelete`/`onEdit` optional; deleted cards render only "Details" button
- Add toggle state (`showDeleted`) to `devices.tsx`
- Toggle button below the section: "Show deleted devices (N)" / "Hide deleted devices"
- Section slides in/out with `transition-all duration-300`
- Delete `DeletedDeviceCard.tsx` and its test file

### Out of Scope
- Backend/API changes
- Changes to the event timeline or event creation
- Changes to active device cards behavior

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `web-devices`: Replace muted visuals with standard card styling; add show/hide toggle; `DeviceGridCard` supports action-only mode

## Approach

1. Make `onDelete` and `onEdit` optional in `DeviceGridCard`; conditionally render Edit/Delete buttons
2. Refactor `DeletedDevicesList` to accept `showDeleted` + `onToggle` props, use `DeviceGridCard` internally
3. Add `showDeleted` state in `devices.tsx`; conditionally render the section with slide animation
4. Remove `DeletedDeviceCard.tsx` and its test
5. Update all affected tests

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `DeviceGridCard.tsx` | Modified | Optional onDelete/onEdit, conditional buttons |
| `DeletedDevicesList.tsx` | Refactored | Use DeviceGridCard, toggle prop |
| `devices.tsx` | Modified | showDeleted state, toggle button, animation |
| `DeletedDeviceCard.tsx` | Removed | No longer needed |
| Test files | Modified | All affected components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| DeviceGridCard changes break active cards | Low | Make props optional, test both modes |
| Animation causes layout shift | Low | Use max-height or grid-row with overflow-hidden |

## Rollback Plan

Revert: `DeviceGridCard.tsx`, `DeletedDevicesList.tsx`, `devices.tsx`. Restore `DeletedDeviceCard.tsx` from archive.

## Dependencies

None — pure frontend refactor.

## Success Criteria

- [ ] Deleted section hidden by default; toggle button visible
- [ ] Toggle shows/hides section with animation
- [ ] Deleted cards look identical to active cards (no opacity, no badge)
- [ ] Deleted cards show only "Details" button
- [ ] `DeletedDeviceCard.tsx` removed
- [ ] All tests pass, tsc clean, vite build succeeds
