# Proposal: Modal Timeline Layout Fix

## Intent

Two CSS bugs in the deleted device detail modal:
1. **Scrollbar** — `.timeline-scroll` `<style>` tag injection inside a React component fails outside Chrome DevTools responsive mode. The `scrollbar-thin` utility in `index.css` already provides identical cross-browser styling but is unused.
2. **Modal overflow** — Modal panel uses `flex flex-col overflow-hidden` but children lack `min-h-0`, so content overflows beyond `max-h-[90vh]` when the browser window shrinks.

## Scope

### In Scope
- Replace inline `<style>` tag + `.timeline-scroll` class in `DeletedDevicesList.tsx` with the existing `scrollbar-thin` utility from `index.css`
- Remove redundant `style={{ scrollbarWidth, scrollbarColor }}` inline — `scrollbar-thin` handles Firefox too
- Add `min-h-0 flex-1` wrapper around `{children}` in `Modal.tsx` so flex-col layout constrains content properly
- Verify all 5 Modal consumers (`DeleteDialog`, `DeviceFormModal`, `LiveMetrics`, `DeletedDevicesList`, `devices.$id`) still render correctly

### Out of Scope
- Global scrollbar styling for the entire app
- New scrollbar customisation features
- Modal resize/drag capabilities

## Capabilities

### New Capabilities
None — this is a bugfix, not new functionality.

### Modified Capabilities
None — no spec-level requirement changes. Implementation details only.

## Approach

**Modal.tsx**: Wrap `{children}` in `<div className="min-h-0 flex-1">`. This enforces the `flex-col` contract — children can shrink below intrinsic height, and `overflow-hidden` on the panel clips correctly. No `overflow-y-auto` here — each consumer manages its own internal scrolling.

**DeletedDevicesList.tsx**: Drop `<style>` injection (7 lines). Replace `.timeline-scroll` class with `scrollbar-thin`. Drop `style={{ scrollbarWidth, scrollbarColor }}`. The `scrollbar-thin` utility in `index.css` already sets `scrollbar-width: thin` (Firefox) and `::-webkit-scrollbar` pseudo-elements (Chrome/Safari) with the same slate colours.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/components/shared/Modal.tsx` | Modified | Add `min-h-0 flex-1` wrapper around children |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modified | Remove `<style>` tag, use `scrollbar-thin` utility |
| `web-ui/src/components/shared/__tests__/Modal.test.tsx` | Verified | Existing tests must pass with layout change |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `min-h-0` wrapper breaks existing Modal consumers with specific height-dependent layouts | Low | All 5 consumers pass simple content; flex-1 on a single child is a no-op for short content |
| `scrollbar-thin` utility not compiled by Tailwind v4 | Low | Utility already exists in `index.css`; verify with `npx vite build` |

## Rollback Plan

Revert the `Modal.tsx` wrapper and `DeletedDevicesList.tsx` `<style>` tag in a single commit. No DB/API changes — pure frontend CSS.

## Dependencies

None.

## Success Criteria

- [ ] Scrollbar renders with slate colours in Chrome normal + responsive mode, Firefox, and Safari
- [ ] Modal content stays within `max-h-[90vh]` when browser window is resized to any height
- [ ] Bottom padding (`pb-6`) on EventTimeline cards remains visible — last card "breathes"
- [ ] All 5 Modal consumers render without regressions (DeleteDialog, DeviceFormModal, LiveMetrics, DeletedDevicesList, devices.$id)
- [ ] Existing Modal tests (17 test cases) pass unchanged
- [ ] Vite build succeeds with zero errors
- [ ] TypeScript compilation: zero errors
