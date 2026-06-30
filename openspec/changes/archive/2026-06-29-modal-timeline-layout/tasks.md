# Tasks: Modal Timeline Layout Fix

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~35–40 |
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
| 1 | Fix scrollbar CSS + modal overflow + remove ad-hoc scrollbar code | PR 1 | One commit; existing tests verify behaviour |

## Phase 1: Fix Scrollbar CSS Utility

- [ ] 1.1 Convert `@utility scrollbar-thin` (lines 18–39, `web-ui/src/index.css`) to standard `.scrollbar-thin` CSS class. Replace all `&::-webkit-scrollbar*` nested selectors with non-nested `.scrollbar-thin::-webkit-scrollbar*` selectors. Keep identical property values (width, colours, border-radius). Tailwind v4's `@utility` renders `&` literally — standard selectors compile correctly in every pipeline.

## Phase 2: Apply Layout Fixes

- [ ] 2.1 Wrap `{children}` (line 144, `web-ui/src/components/shared/Modal.tsx`) in `<div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin pr-2 pb-6">`. This enforces flex-col shrink contract so content stays within `max-h-[90vh]`. The wrapper only scrolls when content overflows.
- [ ] 2.2 Remove `<style>` tag (lines 202–207), inline `style` prop (line 200), and `overflow-y-auto timeline-scroll` classes (line 199) from timeline container in `web-ui/src/components/devices/DeletedDevicesList.tsx`. Apply `scrollbar-thin` class. Remove the inner `<div className="pb-6">` wrapper (now handled by Modal). Keep `max-h-[60vh] pr-3`.

## Phase 3: Verification

- [ ] 3.1 Run Modal unit tests: `npm test -- Modal.test.tsx` — all 17 tests pass (wrapper is transparent to DOM queries and focus trap)
- [ ] 3.2 Run DeletedDevicesList tests: `npm test -- DeletedDevicesList.test.tsx` — all tests pass
- [ ] 3.3 Run full test suite: `npm test` — zero regressions
- [ ] 3.4 Build check: `npm run build` (tsc + vite) — zero errors, `.scrollbar-thin` present in output CSS
- [ ] 3.5 Manual visual check: open deleted-device modal in Chrome (normal + responsive modes), Firefox, and Safari — verify slate-coloured thin scrollbar renders and bottom padding (`pb-6`) is visible
