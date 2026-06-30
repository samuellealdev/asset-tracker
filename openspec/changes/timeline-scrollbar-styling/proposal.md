# Proposal: Timeline Scrollbar Styling

## Intent

The Event Timeline section inside the deleted device detail modal has a scrollable container (`max-h-[60vh] overflow-y-auto`) that renders the browser's default scrollbar. On Windows/Linux this is light gray; on macOS it's semi-transparent. Both clash with the dark slate theme (`bg-slate-800`), breaking visual cohesion in an otherwise polished dark UI.

## Scope

### In Scope

- Apply the existing `scrollbar-thin` utility class to the timeline scrollable container in `DeletedDevicesList.tsx`
- One className addition — zero behavioral or structural changes

### Out of Scope

- Creating new CSS utilities (the `scrollbar-thin` utility already exists in `index.css`)
- Styling scrollbars anywhere else in the app
- Adding new dependencies or Tailwind plugins

## Capabilities

### New Capabilities

None

### Modified Capabilities

None — pure visual CSS application. The `scrollbar-thin` utility already exists and is already covered by `web-dark-theme` color palette requirements.

## Approach

Add the existing `scrollbar-thin` utility class to the timeline container `<div>` in `DeletedDevicesList.tsx` line 197:

```diff
- <div className="max-h-[60vh] overflow-y-auto">
+ <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
```

The `scrollbar-thin` utility (already in `src/index.css`) provides:
- **Firefox**: `scrollbar-width: thin`
- **Chrome/Safari/Edge**: 6px wide scrollbar, slate-800 track, slate-600 thumb, slate-500 thumb on hover
- Fully rounded corners via `border-radius: 9999px`

No CSS changes, no new files, no dependencies.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/components/devices/DeletedDevicesList.tsx:197` | Modified | Add `scrollbar-thin` to container className |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scrollbar too subtle to discover | Low | 6px width matches common thin-scrollbar patterns; hover state provides visual feedback |
| Utility class not loaded in some build | Low | Already imported via `@import "tailwindcss"` in `index.css`; Tailwind 4 `@utility` directive ensures it's always available |

## Rollback Plan

Remove `scrollbar-thin` class from the className string at line 197. Reverts to browser default scrollbar instantly. No other files affected.

## Dependencies

None.

## Success Criteria

- [ ] Scrolling the Event Timeline inside the deleted device modal shows a thin dark-themed scrollbar (slate-600 thumb, dark track) on Chrome, Firefox, Safari, and Edge
- [ ] No regressions: timeline scrolling, event loading, error/retry states all work identically
- [ ] Visual audit confirms no light-colored scrollbar artifacts in dark mode
