# Design: Modal Timeline Layout Fix

## Technical Approach

Two CSS bugs in the deleted-device modal: (1) `<style>` tag injection for scrollbar styling breaks outside Chrome DevTools responsive mode, and (2) modal content overflows beyond `max-h-[90vh]` on window resize.

Root causes: Tailwind v4 `@utility` blocks render `&` literally for pseudo-elements (`.scrollbar-thin::-webkit-scrollbar` never matches in browsers), and the `flex flex-col overflow-hidden` panel lacks `min-h-0` on its flex child, so the browser computes min-height from the child's intrinsic size, defeating `overflow-hidden`.

Fix: convert `@utility scrollbar-thin` to a standard CSS class in `index.css`, wrap Modal children in a scrollable `min-h-0 flex-1` container, and remove the ad-hoc `<style>` + inline styles from `DeletedDevicesList.tsx`.

## Architecture Decisions

### Decision 1: Fix scrollbar CSS at the utility layer

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **A. Standard CSS class** | Works everywhere; simple; no build-dependency | **Chosen** |
| B. Keep `@utility`, fix Tailwind config | Requires Tailwind v4 plugin/config changes; still fragile | Rejected |
| C. CSS module | Adds module dependency; overkill for one class | Rejected |

**Rationale**: Tailwind v4's `@utility` directive renders `&` literally — the output CSS contains `&::-webkit-scrollbar` instead of `.scrollbar-thin::-webkit-scrollbar`. A standard `.scrollbar-thin { ... }` rule with non-nested pseudo-element selectors compiles correctly in any CSS pipeline. The class name stays identical — zero consumer changes.

### Decision 2: Handle modal overflow at the Modal component level

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **A. Wrap children in Modal** | Single fix for all 5 consumers; consistent UX | **Chosen** |
| B. Fix per-consumer | 5 changes; risk of missing one; inconsistent scrollbar placement | Rejected |

**Rationale**: `flex flex-col overflow-hidden` on the panel requires `min-h-0` on flex children to allow shrinking below intrinsic height. Without it, the browser treats the child's natural height as the minimum and `overflow-hidden` clips invisibly. Adding `<div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin pr-2 pb-6">` around `{children}` enforces the contract. `overflow-y-auto` only shows a scrollbar when content overflows — short content is unaffected. `pr-2` keeps content off the scrollbar track; `pb-6` gives the last element breathing room.

### Decision 3: Remove scroll handling from DeletedDevicesList

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **A. Single scrollable area (Modal wrapper)** | No nested scrollbars; less code | **Chosen** |
| B. Keep per-consumer overflow + Modal wrapper | Nested scrollbars (bad UX); duplicates scrollbar code | Rejected |

**Rationale**: Delete the 7-line `<style>` tag, the inline `style={{ scrollbarWidth, scrollbarColor }}`, and `overflow-y-auto` from the timeline container. The Modal wrapper now provides scrolling for all modal content — keeping `overflow-y-auto` on the timeline creates nested scrollbars. The `max-h-[60vh]` constraint on the timeline container can remain (content flows beyond it into the wrapper's scrollable area) or can be removed per implementation preference. Nineteen lines of ad-hoc scrollbar code removed.

## Data Flow

No data flow changes — pure CSS and layout.

```
Modal panel (flex flex-col overflow-hidden max-h-[90vh])
├── Header (title + close button) — natural height
└── Wrapper (min-h-0 flex-1 overflow-y-auto) — scrolls when needed
    └── Consumer children — flow naturally, wrapper scrolls if too tall
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/index.css` | Modify | Replace `@utility scrollbar-thin` block (lines 18–39) with standard `.scrollbar-thin` CSS class using non-nested `::-webkit-scrollbar-*` selectors |
| `web-ui/src/components/shared/Modal.tsx` | Modify | Wrap `{children}` (line 144) in `<div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin pr-2 pb-6">` |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modify | Remove `<style>` tag (lines 202–207), inline `style` (line 200), `overflow-y-auto` and `timeline-scroll` classes (line 199) |

## Interfaces / Contracts

None. No API, props, types, or data structures change.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Modal rendering with wrapper | 17 existing Modal tests — wrapper is transparent to DOM queries and focus trap |
| Build | Tailwind compilation | `npx vite build` — zero errors, `.scrollbar-thin` present in output CSS |
| TypeScript | Type checking | `npx tsc --noEmit` — zero errors |
| Visual | Scrollbar rendering | Open deleted-device modal → verify slate scrollbar in Chrome (normal + responsive mode), Firefox, Safari |
| Visual | Modal overflow on resize | Open modal → resize browser to 400px height → content stays within viewport, bottom padding visible |
| Visual | Modal consumer regressions | Open all 5 consumers (DeleteDialog, DeviceFormModal, LiveMetrics, DeletedDevicesList, devices.$id) — verify rendering |

## Migration / Rollout

No migration required. Rollback: revert the 3 file changes in a single commit. No DB, API, or config changes.

## Open Questions

None.
