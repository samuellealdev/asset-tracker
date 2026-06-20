# web-dark-theme Specification

## Purpose
Cohesive dark color scheme for all 15 web-ui components. Tailwind 4 utility classes only — no hex, no `var()` in className.

## Color Mapping

| Element | Dark Value |
|---------|-----------|
| Page / AppLayout main | `bg-slate-900` |
| Cards, tables, modals, dashboards | `bg-slate-800` |
| Inputs (text, select, textarea) | `bg-slate-800` |
| Container borders | `border-slate-700` |
| Input borders | `border-slate-600` |
| Primary / heading text | `text-slate-100` |
| Body text | `text-slate-200` / `text-slate-300` |
| Labels / secondary text | `text-slate-400` |
| Placeholder | `placeholder-slate-500` |
| Table header bg | `bg-slate-700` |
| Focus ring | `ring-indigo-500` |
| Hover (row) | `hover:bg-indigo-900/20` |
| Hover (button) | `hover:bg-slate-700` |
| Error bg | `bg-red-900/20` |
| Error text | `text-red-400` |
| Warning value | `text-amber-300` |
| Skeleton bars | `bg-slate-700` |
| Overlay | `bg-black/60` |
| Badges: green/blue/red | `bg-{color}-900/30 text-{color}-300` |
| Sidebar | `bg-slate-800` (already dark) |
| Header | `bg-slate-900` (already dark) |
| Active nav link | `bg-indigo-600 text-white` |

## Requirements

### Requirement: No Light Backgrounds
No component in any state SHALL use `white`, `slate-50`, `slate-100`, or `slate-200` backgrounds. All surfaces MUST use `slate-800` (cards, modals, tables) or `slate-900` (page, header).

#### Scenario: Surface audit
- GIVEN any rendered component
- THEN background is `bg-slate-800`, `bg-slate-900`, `bg-slate-700`, or transparent
- AND no `bg-white`, `bg-slate-50`, or `bg-slate-100` classes remain

### Requirement: Text Contrast
All text MUST meet WCAG AA (≥4.5:1 normal, ≥3:1 large). Headings MUST be `text-slate-100`, body `text-slate-200/300`, secondary `text-slate-400`. Placeholder MUST be `placeholder-slate-500`.

#### Scenario: Text hierarchy
- GIVEN any component renders
- THEN headings are `text-slate-100`
- AND body text is `text-slate-200` or `text-slate-300`
- AND labels are `text-slate-300` or `text-slate-400`
- AND input placeholders are `placeholder-slate-500`

### Requirement: Interactive States
Focus rings MUST be `ring-indigo-500`. Row hover MUST be `hover:bg-indigo-900/20`. Card hover MUST transition border to `border-indigo-500`. Button hover MUST be `hover:bg-slate-700`. Disabled inputs SHALL show reduced opacity.

#### Scenario: Form input interaction
- GIVEN a form input
- WHEN focused, THEN ring is `ring-indigo-500`
- WHEN disabled, THEN opacity is reduced

#### Scenario: Table row interaction
- GIVEN a data row
- WHEN hovered, THEN background becomes `indigo-900/20`

#### Scenario: Card interaction
- GIVEN a clickable card
- WHEN hovered, THEN border transitions to `border-indigo-500`

### Requirement: Error and Warning States
Error states MUST use `text-red-400` with `bg-red-900/20`. Form validation errors, card/table fallback errors, ErrorBoundary, and MetricsCard error indicators SHALL follow this. MetricsCard warning (error_count ≤ 50) SHALL use `text-amber-300`.

#### Scenario: Form validation error
- GIVEN validation fails
- THEN error message is `text-red-400` with `bg-red-900/20`

#### Scenario: Component error fallback
- GIVEN card, table, or ErrorBoundary catches an error
- THEN message area is `bg-red-900/20` with `text-red-400`

#### Scenario: Metrics warning thresholds
- GIVEN error_count > 50, THEN value is `text-red-400`
- GIVEN error_count > 0 and ≤ 50, THEN value is `text-amber-300`

### Requirement: Loading and Empty States
LoadingSkeleton bars MUST use `bg-slate-700` on `bg-slate-800` with `animate-pulse`. EmptyState icon container MUST use `bg-slate-700`, icon `text-slate-400`, and message `text-slate-500`. Metrics unavailable state SHALL use `bg-red-900/20` with `text-red-400`.

#### Scenario: Skeleton loading
- GIVEN data is loading
- THEN skeleton rows/bars are `bg-slate-700` on `bg-slate-800` with `animate-pulse`

#### Scenario: Empty list
- GIVEN zero items
- THEN icon container is `bg-slate-700`, icon is `text-slate-400`, title is `text-slate-500`

### Requirement: Component-Specific Dark Patterns
Each component group MUST apply the dark palette to all states:

| Group | Components | Key Dark Classes |
|-------|-----------|-----------------|
| Forms | Login, DeviceForm, EventForm | Inputs `bg-slate-800 border-slate-600 text-slate-100`, labels `text-slate-300`, cancel `text-slate-300 hover:bg-slate-700` |
| Cards | DeviceCard, HealthCard, MetricsCard | `bg-slate-800 border-slate-700`, heading `text-slate-100`, skeleton `bg-slate-700` |
| Tables | DeviceTable, EventTable | Header `bg-slate-700 text-slate-300`, rows `text-slate-200`, borders `divide-slate-700`, actions `text-slate-300` |
| Layout | Header, Sidebar, AppLayout | Header `bg-slate-900 text-slate-100`, Sidebar `bg-slate-800` active `bg-indigo-600`, AppLayout `bg-slate-900` |
| Modals | DeleteDialog | Overlay `bg-black/60`, dialog `bg-slate-800 border-slate-600 text-slate-100` |
| Timeline | EventTimeline | Cards `bg-slate-800`, line `bg-slate-700`, dots `ring-slate-700`, badges `bg-{color}-900/30 text-{color}-300` |
| Shared | ErrorBoundary, EmptyState, LoadingSkeleton | See Requirements 4 and 5 above |

#### Scenario: Login form dark
- GIVEN login page renders
- THEN card is `bg-slate-800`, inputs are `bg-slate-800 border-slate-600`, labels `text-slate-300`

#### Scenario: Delete dialog dark
- GIVEN delete confirmation opens
- THEN overlay is `bg-black/60`, dialog `bg-slate-800 text-slate-100`, border `border-slate-600`

#### Scenario: EventTimeline dark
- GIVEN timeline renders events
- THEN vertical line is `bg-slate-700`, dots have `ring-slate-700`
- AND event cards are `bg-slate-800 border-slate-700`
- AND badges use dark-adapted color pairs

### Requirement: No Hard-Coded Colors
The implementation MUST NOT use hex colors (`[#...]`), CSS `var()` in className, or inline `style` color values. All colors SHALL be Tailwind utility classes.

#### Scenario: Color source audit
- GIVEN any component file
- THEN no `bg-[#...]`, `text-[#...]`, `[var(...)]`, or `style={{color:...}}` exists
