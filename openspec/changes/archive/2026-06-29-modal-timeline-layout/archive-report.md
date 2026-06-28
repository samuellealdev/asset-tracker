# Archive Report: Modal Timeline Layout Fix

## Summary

- **Change**: modal-timeline-layout
- **Date archived**: 2026-06-29
- **Verdict**: PASS ✅ — all 7 spec criteria, 7 tasks, 348 tests
- **Commit**: `aa54267`
- **Branch**: `feat/web-ui`

## Delta Specs

This change had **no spec-level deltas** — it was a pure CSS bugfix. No requirements, interfaces, or data contracts were created, modified, or removed. The `openspec/` directory contains no delta spec files for this change.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/index.css` | Modified | Replaced `@utility scrollbar-thin` (literal `&` output in Tailwind v4) with standard `.scrollbar-thin` CSS class using non-nested pseudo-element selectors |
| `web-ui/src/components/shared/Modal.tsx` | Modified | Added `min-h-0 flex-1 overflow-y-auto` wrapper around `{children}`; added scoped `<style>` tag with `!important` scrollbar rules; added Firefox inline `scrollbarWidth`/`scrollbarColor` props |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modified | Removed ad-hoc `<style>` tag (7 lines), inline `style` prop, `overflow-y-auto timeline-scroll` classes |

## Design Deviations

- **Modal gets its own `<style>` tag** with `modal-scroll-area` class (`!important` rules) for 8px scrollbar width and lighter thumb color — the `scrollbar-thin` utility uses 6px width. Both co-exist.
- **Firefox inline props** kept on Modal wrapper — Firefox has no `::-webkit-scrollbar` support.

Both deviations were pragmatic refinements during implementation, not spec changes.

## Testing

| Gate | Result |
|------|--------|
| Unit tests | 47 files, 348 tests — all pass |
| TypeScript | `npx tsc --noEmit` — zero errors |
| Production build | `npx vite build` — 3.50s |

## Verification Report

Full details: `verify-report.md` in this directory.

## Post-Archive Note

A `<style>` tag injection approach exists in `Modal.tsx` (line 116) with `!important` rules. This is safe because:
1. The `<style>` tag renders inside the React portal, inside a fixed-position overlay — no cascade leakage to the main document
2. `!important` ensures Chrome/Safari scrollbar rules apply despite any specificity battle
3. Firefox uses inline `scrollbarWidth`/`scrollbarColor` props instead

If the team prefers to eliminate the `<style>` tag entirely, the `scrollbar-thin` utility in `index.css` can be parameterized (e.g., CSS custom properties for width and color) and the Modal would use a variant class instead.
