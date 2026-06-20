# Proposal: Dark Theme for Web UI

## Intent

The web-ui has a visual split: sidebar/header use dark colors (slate-800/950) while forms, cards, tables, and dialogs use light backgrounds (white, slate-50/100). This creates a jarring light-on-dark inconsistency. Convert all components to a cohesive dark color scheme.

## Scope

### In Scope
- Login page: form card, inputs, labels, error states
- Header: background, title, logout button
- AppLayout: main content area background
- DeviceCard: card background, skeleton, error state, type badge, hover
- DeviceTable: container, header row, alternating rows, dividers, badges, action buttons, empty/error states
- DeviceForm: labels, inputs, selects, cancel button
- DeleteDialog: modal background, title, body text, buttons
- EventTable: same patterns as DeviceTable + event-type badges
- EventForm: labels, inputs, selects, textarea, cancel button
- HealthCard: card background, title, port label, status text
- MetricsCard: card background, metric items, unavailable state
- LoadingSkeleton: bar backgrounds for table and card variants
- EmptyState: icon container, title, description
- ErrorBoundary: fallback UI (if light-styled)
- All placeholder text contrast

### Out of Scope
- Light/dark theme toggle
- User preference persistence
- New components or pages
- Backend changes

## Capabilities

### New Capabilities
- `web-dark-theme`: Convert all UI components to a consistent dark color scheme with proper contrast ratios

### Modified Capabilities
None — this change is purely presentational. Existing specs define functional behavior, not visual color themes.

## Approach

Apply Tailwind CSS 4 utility classes directly — no custom CSS, no CSS variables in className, no hex colors.

**Dark palette:**
- Page background: `bg-slate-900`
- Card/modal/surface: `bg-slate-800`
- Inputs: `bg-slate-700`
- Borders: `border-slate-700` (containers), `border-slate-600` (inputs)
- Primary text: `text-slate-100`
- Secondary text: `text-slate-300/400`
- Placeholder: `placeholder-slate-500`
- Hover backgrounds: `hover:bg-slate-700` (buttons), `hover:bg-indigo-900/20` (rows)
- Error states: `bg-red-900/20` + `text-red-400`
- Badges: `bg-slate-700 text-slate-300`, `bg-indigo-900/30 text-indigo-300`
- Skeleton bars: `bg-slate-700` on `bg-slate-800`

Rewrite one component at a time. Update existing visual regression tests (check that role/text assertions still pass — no logic changes).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/routes/login.tsx` | Modified | Login card, inputs, error alert |
| `web-ui/src/components/layout/Header.tsx` | Modified | Header bg, title, logout btn |
| `web-ui/src/components/layout/AppLayout.tsx` | Modified | Main bg from slate-50 → slate-900 |
| `web-ui/src/components/devices/DeviceCard.tsx` | Modified | Card, skeleton, error, badge, hover |
| `web-ui/src/components/devices/DeviceTable.tsx` | Modified | Table, rows, badges, actions, error |
| `web-ui/src/components/devices/DeviceForm.tsx` | Modified | Labels, inputs, cancel btn |
| `web-ui/src/components/devices/DeleteDialog.tsx` | Modified | Modal bg, text, buttons |
| `web-ui/src/components/events/EventTable.tsx` | Modified | Table + inline skeleton/error/empty states |
| `web-ui/src/components/events/EventForm.tsx` | Modified | Labels, inputs, selects, textarea |
| `web-ui/src/components/dashboards/HealthCard.tsx` | Modified | Card, skeleton, status text |
| `web-ui/src/components/dashboards/MetricsCard.tsx` | Modified | Card, metric items, unavailable state |
| `web-ui/src/components/shared/LoadingSkeleton.tsx` | Modified | Skeleton bar colors |
| `web-ui/src/components/shared/EmptyState.tsx` | Modified | Icon, title, description colors |
| `web-ui/src/components/shared/ErrorBoundary.tsx` | Modified | Fallback UI (to verify) |
| `web-ui/src/components/events/EventTimeline.tsx` | Modified | Timeline variant (to verify) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing a component or state variant (e.g., disabled outlines) | Low | Systematic component-by-component review, visual regression tests |
| Contrast too low on certain states (e.g., amber text on dark bg) | Low | Use Tailwind's built-in slate scale with established contrast; verify MetricsCard warning levels |

## Rollback Plan

Git revert the feat/web-ui branch to the prior commit. No data migration, no backend changes — purely client-side CSS class changes.

## Dependencies

None — this is a continuation of feat/web-ui branch, no new APIs or services needed.

## Success Criteria

- [ ] All components use the dark palette consistently
- [ ] No white/slate-50/slate-100 backgrounds remain in forms, cards, tables, or modals
- [ ] All text has WCAG AA contrast (≥4.5:1 for body, ≥3:1 for large text)
- [ ] Existing tests pass (role/text assertions unchanged)
- [ ] No hex colors or var() in className introduced
