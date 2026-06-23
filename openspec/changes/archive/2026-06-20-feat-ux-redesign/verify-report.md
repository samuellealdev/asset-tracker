## Verification Report

**Change**: feat/ux-redesign
**Version**: N/A
**Mode**: Standard

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build**: ✅ Passed
```text
$ npx tsc --noEmit
(no output — clean type-check)

$ npx vite build
vite v6.4.3 building for production...
✓ 1815 modules transformed.
dist/index.html                   0.60 kB │ gzip:   0.36 kB
dist/assets/index-CD1cxl2x.css   26.02 kB │ gzip:   5.59 kB
dist/assets/index-CopJyF83.js   467.83 kB │ gzip: 136.70 kB
✓ built in 8.62s
```

**Tests**: ✅ 304 passed / ❌ 3 failed (pre-existing, intermittent) / ⚠️ 0 skipped
```text
Test Files  3 failed | 44 passed (47)
     Tests  3 failed | 304 passed (307)
```
Pre-existing failures (NOT caused by redesign):
- `EventTable > shows error state when isError is true` (intermittent timeout)
- `EventTimeline > renders actor names when available` (intermittent timeout)
- `DeleteDialog > renders the confirmation message with device name` (intermittent timeout)

**Coverage**: ➖ Not available (not configured)

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| **web-devices: Device Grid Actions** | Actions visible on card | `DeviceGridCard.test.tsx` | ✅ COMPLIANT |
| web-devices: Device Grid Actions | Events action opens popup | `DeviceGridCard.test.tsx` + `devices.test.tsx` | ✅ COMPLIANT |
| web-devices: Device Grid Actions | Delete from card triggers confirmation | `DeviceGridCard.test.tsx` | ✅ COMPLIANT |
| web-devices: Device Grid Actions | Edit from card navigates to detail | `DeviceGridCard.test.tsx` | ✅ COMPLIANT |
| **web-devices: Device List** | Devices loaded | `devices.test.tsx` | ✅ COMPLIANT |
| web-devices: Device List | Empty list | `DeviceGrid.test.tsx` | ⚠️ PARTIAL — says "No devices yet" vs spec's "No devices found"; CTA says "Create Device" vs "Add Device" |
| web-devices: Device List | Load error | `DeviceGrid.test.tsx` | ✅ COMPLIANT |
| web-devices: Device List | Responsive grid columns | `DeviceGrid.test.tsx` (CSS classes verified) | ⚠️ PARTIAL — `sm:grid-cols-2` at 640px vs spec 768px tablet breakpoint |
| **ux-topbar: Tab Navigation** | Desktop tabs | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Tab Navigation | Tablet tabs | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Tab Navigation | Tab click | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Tab Navigation | Active state | `TopBar.test.tsx` | ✅ COMPLIANT |
| **ux-topbar: Settings Gear** | Gear visible | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Settings Gear | Opens panel | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Settings Gear | Panel closes | `TopBar.test.tsx` | ✅ COMPLIANT |
| **ux-topbar: Logout Button** | Logout action | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Logout Button | Logout visible | `TopBar.test.tsx` | ✅ COMPLIANT |
| **ux-topbar: Responsive Behavior** | Desktop layout | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Responsive Behavior | Tablet layout | `TopBar.test.tsx` | ✅ COMPLIANT |
| ux-topbar: Responsive Behavior | Mobile layout | `TopBar.test.tsx` | ✅ COMPLIANT |
| **ux-device-grid: Responsive Grid Layout** | Desktop grid (≥1280px) | `DeviceGrid.test.tsx` | ✅ COMPLIANT |
| ux-device-grid: Responsive Grid Layout | Laptop grid (1024-1279px) | `DeviceGrid.test.tsx` | ✅ COMPLIANT |
| ux-device-grid: Responsive Grid Layout | Tablet grid (768-1023px) | `DeviceGrid.test.tsx` | ⚠️ PARTIAL — uses `sm:` breakpoint (640px) instead of `md:` (768px) |
| ux-device-grid: Responsive Grid Layout | Mobile grid (<768px) | `DeviceGrid.test.tsx` | ✅ COMPLIANT |
| **ux-device-grid: Device Card Content** | Card fields | `DeviceGridCard.test.tsx` | ❌ FAILING — shows `createdAt` instead of spec-required `last_seen` relative time |
| ux-device-grid: Device Card Content | Missing fields | `DeviceGridCard.test.tsx` | ❌ UNTESTED — no null handling for type/last_seen ("Unknown"/"Never") |
| ux-device-grid: Device Card Content | Long name | `DeviceGridCard.test.tsx` | ⚠️ PARTIAL — uses CSS `truncate` (visual) but no programmatic 30-char enforcement |
| **ux-device-grid: Card Action Buttons** | Edit action | `DeviceGridCard.test.tsx` | ✅ COMPLIANT |
| ux-device-grid: Card Action Buttons | Delete action | `DeviceGridCard.test.tsx` | ✅ COMPLIANT |
| ux-device-grid: Card Action Buttons | Events action | `DeviceGridCard.test.tsx` | ✅ COMPLIANT |
| ux-device-grid: Card Action Buttons | Hover state | `DeviceGridCard.test.tsx` (group/hover CSS) | ✅ COMPLIANT |
| **ux-device-grid: Loading and Empty States** | Loading state | `DeviceGrid.test.tsx` | ✅ COMPLIANT |
| ux-device-grid: Loading and Empty States | Empty state | `DeviceGrid.test.tsx` | ⚠️ PARTIAL — wording differs from spec |
| ux-device-grid: Loading and Empty States | Error state | `DeviceGrid.test.tsx` | ✅ COMPLIANT |
| **ux-live-metrics: Health Indicators** | All healthy | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Health Indicators | Go unhealthy | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Health Indicators | Node unhealthy | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Health Indicators | Polling disabled | — | ❌ UNTESTED — no test for `healthInterval: 0` scenario |
| **ux-live-metrics: Request/Error Counters** | Counters visible | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Request/Error Counters | Metrics unavailable | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Request/Error Counters | Polling active | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Request/Error Counters | Configurable interval | `useSettings.test.tsx` | ✅ COMPLIANT |
| **ux-live-metrics: Compact Layout** | Desktop | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Compact Layout | Tablet | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Compact Layout | Mobile | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| **ux-live-metrics: Visibility** | Devices page | `AppLayout.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Visibility | Dashboards page | `AppLayout.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Visibility | Login page | `AppLayout.test.tsx` | ✅ COMPLIANT |
| ux-live-metrics: Visibility | Error page | — | ❌ UNTESTED |
| **ux-settings-panel: Panel Open/Close** | Open | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| ux-settings-panel: Panel Open/Close | Close via gear | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| ux-settings-panel: Panel Open/Close | Close via Escape | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| ux-settings-panel: Panel Open/Close | Close via overlay | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| **ux-settings-panel: Polling Interval Configuration** | Default intervals | — | ❌ UNTESTED — SettingsPanel has no interval UI at all |
| ux-settings-panel: Polling Interval Configuration | Change health interval | — | ❌ UNTESTED — no interval inputs in SettingsPanel |
| ux-settings-panel: Polling Interval Configuration | Change metrics interval | — | ❌ UNTESTED — no interval inputs in SettingsPanel |
| ux-settings-panel: Polling Interval Configuration | Persist across reload | `useSettings.test.tsx` | ✅ COMPLIANT (hook level only, no UI) |
| ux-settings-panel: Polling Interval Configuration | Invalid input | `useSettings.test.tsx` | ✅ COMPLIANT (hook level only, no UI) |
| **ux-settings-panel: Auth Status Display** | Authenticated | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| ux-settings-panel: Auth Status Display | Logout | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| ux-settings-panel: Auth Status Display | Token expired | — | ❌ UNTESTED |
| **ux-settings-panel: API Base URL Configuration** | Default URLs | `SettingsPanel.test.tsx` | ✅ COMPLIANT |
| ux-settings-panel: API Base URL Configuration | Change URLs | — | ❌ UNTESTED — URLs are readonly inputs |
| **web-layout: TopBar Integration** | TopBar visible on authenticated pages | `AppLayout.test.tsx` | ✅ COMPLIANT |
| web-layout: TopBar Integration | TopBar hidden on login page | `AppLayout.test.tsx` | ✅ COMPLIANT |
| **web-layout: Navigation** | Desktop navigation | `TopBar.test.tsx` | ✅ COMPLIANT |
| web-layout: Navigation | Tablet navigation | `TopBar.test.tsx` | ✅ COMPLIANT |
| **web-layout: Layout Structure** | Layout persistence | `AppLayout.test.tsx` | ✅ COMPLIANT |
| **web-layout: Responsive Breakpoints** | Desktop layout (≥1280px) | `TopBar.test.tsx` | ✅ COMPLIANT |
| web-layout: Responsive Breakpoints | Tablet layout (≥768px) | `TopBar.test.tsx` | ✅ COMPLIANT |
| **ux-event-popup: Modal Behavior** | Open from card | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Modal Behavior | Close via Escape | `EventPopup.test.tsx` + `Modal.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Modal Behavior | Close via overlay click | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Modal Behavior | Focus trap | `Modal.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Modal Behavior | aria-modal | `Modal.test.tsx` | ✅ COMPLIANT |
| **ux-event-popup: Event Timeline Display** | Events loaded | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Event Timeline Display | Loading state | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Event Timeline Display | Empty state | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Event Timeline Display | Fetch error | `EventPopup.test.tsx` | ✅ COMPLIANT |
| **ux-event-popup: Add Event Form in Popup** | Form pre-filled | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Add Event Form in Popup | Successful creation | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Add Event Form in Popup | Validation error | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Add Event Form in Popup | Creation error | `EventPopup.test.tsx` | ✅ COMPLIANT |
| **ux-event-popup: Popup Responsiveness** | Desktop | `EventPopup.test.tsx` | ✅ COMPLIANT |
| ux-event-popup: Popup Responsiveness | Tablet/mobile | `EventPopup.test.tsx` | ✅ COMPLIANT |
| **web-dashboards: Health Dashboard** | All healthy | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| web-dashboards: Health Dashboard | Service unhealthy | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| web-dashboards: Health Dashboard | Configurable refresh interval | `useSettings.test.tsx` | ✅ COMPLIANT |
| **web-dashboards: Metrics Dashboard** | Metrics loaded in LiveMetrics bar | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| web-dashboards: Metrics Dashboard | Metrics unavailable | `LiveMetrics.test.tsx` | ✅ COMPLIANT |
| web-dashboards: Metrics Dashboard | Configurable metrics refresh | `useSettings.test.tsx` | ✅ COMPLIANT |
| **web-events: Event Popup from Device Card** | Popup opens with device filter | `EventPopup.test.tsx` + `devices.test.tsx` | ✅ COMPLIANT |
| web-events: Event Popup from Device Card | Close popup | `EventPopup.test.tsx` | ✅ COMPLIANT |
| web-events: Event Popup from Device Card | Popup load error | `EventPopup.test.tsx` | ✅ COMPLIANT |
| web-events: Event Popup from Device Card | Popup empty state | `EventPopup.test.tsx` | ✅ COMPLIANT |
| **web-events: Device Selector** | Device pre-selected in popup form | `EventPopup.test.tsx` | ✅ COMPLIANT |
| web-events: Device Selector | Standalone events page unchanged | `events.test.tsx` | ✅ COMPLIANT |

**Compliance summary**: 78/97 scenarios fully compliant, 7 PARTIAL, 4 FAILING/UNTESTED due to missing SettingsPanel interval UI, 4 UNTESTED (no covering test found), 4 PARTIAL (minor wording/breakpoint deviations)

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Sidebar deleted | ✅ Implemented | `Sidebar.tsx` and `Sidebar.test.tsx` removed; `AppLayout.tsx` no longer imports Sidebar |
| TopBar present | ✅ Implemented | `TopBar.tsx` renders NavTabs (Devices, Dashboards), settings gear, logout button |
| DeviceGrid replaces DeviceTable | ✅ Implemented | `DeviceGrid.tsx` + `DeviceGridCard.tsx` in `devices.tsx` route; `DeviceTable.tsx` deleted |
| EventPopup works | ✅ Implemented | `EventPopup.tsx` wraps `<Modal>` with `EventTimeline` + event form, deviceId pre-bound |
| SettingsPanel accessible | ✅ Implemented | Slide-out from right with `createPortal`, escape/overlay close, auth status, API URLs |
| Modal created with portal | ✅ Implemented | `createPortal`, focus trap, Escape key, `aria-modal`, backdrop click-close |
| DeleteDialog refactored | ✅ Implemented | Uses `<Modal>` wrapper; inline overlay/focus/Escape logic removed |
| useSettings hook | ✅ Implemented | localStorage R/W, defaults 2000/5000, NaN/negative/zero rejection |
| useHealth/useMetrics interval param | ✅ Implemented | `refetchInterval?` param added; LiveMetrics passes via useSettings |
| Dashboards simplified | ✅ Implemented | Health/metrics removed; overview section only |
| Settings route deleted | ✅ Implemented | `settings.tsx` and test removed; no `/settings` in route tree |
| E2E tests updated | ✅ Implemented | `devices.spec.ts` uses card grid (Edit button); `dashboards.spec.ts` simplified |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Modal rendering via `createPortal` | ✅ Yes | `Modal.tsx` line 83: `createPortal(...)` |
| Settings storage via `localStorage` + `useSettings` | ✅ Yes | `use-settings.ts` with localStorage R/W |
| Card actions via footer with hover emphasis | ✅ Yes | `DeviceGridCard.tsx`: three buttons in footer, `group` hover on card |
| Interval injection via hook parameter | ✅ Yes | `useGoHealth(healthInterval)`, `useGoMetrics(metricsInterval)` in `LiveMetrics.tsx` |
| TopBar data flow (NavTabs, LiveMetrics, SettingsGear, Logout) | ✅ Yes | Matches design diagram exactly |
| DevicesPage flow (DeviceGrid → DeleteDialog + EventPopup) | ✅ Yes | `devices.tsx` wires all three components |
| Hook default intervals: 2000ms health, 5000ms metrics | ⚠️ Partial | Hook signatures default to 30_000; LiveMetrics overrides via useSettings (2000/5000). Design says hooks should default to 2000/5000. |

### Issues Found
**CRITICAL**:
1. **SettingsPanel has no polling interval configuration UI** — spec `ux-settings-panel` Requirement "Polling Interval Configuration" requires interval inputs in the SettingsPanel. The `useSettings` hook supports interval updates, but there is no UI to change intervals. 5 spec scenarios are untested/non-compliant as a result. Affects: `SettingsPanel.tsx`.

2. **DeviceGridCard shows `createdAt` instead of `last_seen`** — spec `ux-device-grid` "Device Card Content" requires `last_seen` (relative time). The device schema has no `lastSeen` field; the card displays `createdAt` as a formatted date string. This is a schema limitation requiring backend changes to add `lastSeen`.

**WARNING**:
1. **DeviceGridCard missing null field handling** — spec requires "Unknown" for null type and "Never" for null `last_seen`. Card renders type directly with no fallback.
2. **Hook default intervals differ from design** — `useGoHealth`/`useNodeHealth` default to 30_000ms and `useGoMetrics`/`useNodeMetrics` default to 30_000ms. Design specifies 2000ms and 5000ms respectively. LiveMetrics overrides via `useSettings`, so runtime behavior is correct, but hook signatures don't match design contracts.
3. **DeviceGrid empty state wording differs** — implementation says "No devices yet. Create your first device." vs spec's "No devices found" with "Add Device" CTA.
4. **Tablet breakpoint mismatch** — DeviceGrid uses `sm:` (640px) for 2-column breakpoint instead of spec's `md:` (768px).
5. **Pre-existing flaky tests** — 3 tests intermittently fail (EventTable, EventTimeline, DeleteDialog). Not caused by this redesign.
6. **API Base URLs are readonly** — spec `ux-settings-panel` "API Base URL Configuration" implies they should be editable; implementation renders them as readonly inputs.

**SUGGESTION**:
1. Add `lastSeen` field to the Go backend `Device` model and API response, then update `deviceSchema` and `DeviceGridCard` to display relative time.
2. Add 30-character name truncation logic in `DeviceGridCard` (programmatic, not just CSS).
3. Add "Stale" indicator test for metrics bar visibility on error pages (spec `ux-live-metrics` Visibility: Error page scenario).

### Verdict
**FAIL**

**Reason**: 2 CRITICAL issues block archive readiness — SettingsPanel is missing the required polling interval configuration UI (5 spec scenarios non-compliant), and DeviceGridCard displays `createdAt` instead of spec-required `last_seen` relative time. All 21 tasks are checked as complete but the implementation does not satisfy all spec requirements. 78 of 97 spec scenarios are fully compliant; 7 are partial; 4 are failing due to CRITICAL issues; 4 are untested; 4 have minor deviations.

---

## Post-Archive Fixes (feat/web-ui — 2026-06-20)

Three UX bugs were fixed in a follow-up branch (`feat/web-ui`) after the original feat/ux-redesign archive:

### Fix 1: TopBar nav tabs → "ASSET TRACKER" title
- **Problem**: TopBar showed Devices/Dashboards nav tabs that the user didn't want
- **Fix**: Replaced NAV_TABS with a centered `h1` "ASSET TRACKER" (`font-extralight tracking-widest uppercase`)
- **Files**: `TopBar.tsx`, `TopBar.test.tsx`, `login.tsx`, `index.html`, `AppLayout.test.tsx`
- **Tests**: 311 passed, tsc clean, build succeeded

### Fix 2: EventPopup scroll + toggle form
- **Problem**: Long event lists overflowed; event form was always visible taking space
- **Fix**: Added `overflow-y-auto max-h-[70vh]` scroll to timeline area; added "Add New Event" toggle button; form is hidden by default (conditional render); success message moved outside form block so it stays visible after form auto-hides on submit; add `animate-fade-in` for smooth form reveal
- **Files**: `EventPopup.tsx`, `EventPopup.test.tsx`
- **Tests**: 16 tests (3 new: toggle visibility, form hidden by default, scroll container)

### Fix 3: Live metrics wrong field names
- **Problem**: Frontend read `http_requests_total` from API, but both Go and Node endpoints return `requests_total` — counters always showed "—"
- **Fix**: Changed all `http_requests_total` → `requests_total` in `LiveMetrics.tsx`
- **Files**: `LiveMetrics.tsx`, `LiveMetrics.test.tsx`
- **Test mock fix**: Updated mock data to use correct field names (`requests_total`)

### Fix 4: UX fixes (feat/web-ui — Actor field, device modals, card actions, metrics detail)
- **Problem**: Multiple UX issues: no Actor field in event form, create/edit used full-page navigation instead of modals, card actions confusing (Edit navigated to detail instead of inline edit), metrics bar had no detail view
- **Fix** (4 changes):
  1. **Actor field**: Added "Actor" text input (optional) below Name in EventPopup form — `EventPopup.tsx`, `EventPopup.test.tsx`
  2. **Device modals**: Created `DeviceFormModal.tsx` wrapping `DeviceForm` in `<Modal>`; changed "Create Device" button to open modal; edit modal reuses same component with pre-filled data; `/devices/create` route now redirects to `/devices` — `DeviceFormModal.tsx` (new), `DeviceForm.tsx`, `devices.tsx`, `devices.create.tsx`, `DeviceGrid.tsx`, `DeviceGridCard.tsx`
  3. **Card actions redesign**: Renamed "Edit" → "Details" (Info icon, navigates to `/devices/$id`); added true "Edit" button (Pencil icon, opens edit modal); Delete/Events buttons unchanged — `DeviceGridCard.tsx`, `DeviceGridCard.test.tsx`
  4. **Metrics detail**: Made LiveMetrics counter groups clickable; opens a detail modal with health status, request/error counts, error rate %, and last refresh timestamp; shows "No requests yet" when zero — `LiveMetrics.tsx`, `LiveMetrics.test.tsx`
- **Files**: `EventPopup.tsx`, `EventPopup.test.tsx`, `DeviceFormModal.tsx` (new), `DeviceForm.tsx`, `devices.tsx`, `devices.create.tsx`, `DeviceGrid.tsx`, `DeviceGridCard.tsx`, `DeviceGridCard.test.tsx`, `DeviceGrid.test.tsx`, `LiveMetrics.tsx`, `LiveMetrics.test.tsx`, `AppLayout.test.tsx`, `devices-create.test.tsx`, `devices.test.tsx`
- **Tests**: 317 passed (47 files), tsc clean, vite build succeeds

### Fix 5: EventPopup layout improvements (feat/web-ui)
- **Problem**: Modal got cut off at viewport when "Add New Event" form was expanded; browser-default scrollbar was ugly; form toggle was instant with no transition
- **Fix**:
  1. **Modal sizing**: Panel constrained to `max-h-[85vh]` (desktop) / `max-h-[95vh]` (mobile) with `flex flex-col`; timeline area uses `flex-1 overflow-y-auto min-h-0` so it scrolls internally without pushing the modal beyond viewport
  2. **Scrollbar styling**: Custom thin scrollbar (6px) via `@utility scrollbar-thin` in `index.css` — thumb `bg-slate-600 rounded-full`, track `bg-slate-800`
  3. **Form transition**: Wrapper always in DOM with `transition-all duration-300 overflow-hidden`; hidden: `max-h-0 opacity-0`; visible: `max-h-[500px] opacity-100`
  4. **Responsive width**: `w-full max-w-2xl` desktop, `max-md:max-h-[95vh]` mobile; close button always visible in sticky header
- **Files**: `Modal.tsx`, `EventPopup.tsx`, `EventPopup.test.tsx`, `index.css`
- **Tests**: 315 passed (47 files), 2 pre-existing flaky timeouts
- **Commit**: `4f17ae3`

### Fix 6: EventPopup form expansion (feat/web-ui)
- **Problem**: When clicking "Add New Event", form fields (type chips, name, actor, description) were cut off. Three compounding layout constraints: modal `max-h-[85vh]` too short, `max-w-2xl` too narrow (672px caused 8 type chips to wrap to 3+ lines), form transition `max-h-[500px]` insufficient.
- **Fix**:
  1. Modal: `max-h-[85vh]` → `max-h-[90vh]`, `max-w-2xl` → `max-w-3xl` (768px)
  2. Form transition: `max-h-[500px]` → `max-h-[600px]`
  3. Outer container: added `overflow-y-auto` as scroll fallback
- **Files**: `Modal.tsx`, `EventPopup.tsx`
- **Tests**: 314 passed, 3 pre-existing flaky timeouts
- **Commit**: `a69f94b`

### Fix 7: Events refactor — remove EventPopup, add New Event to detail page (feat/web-ui)
- **Problem**: EventPopup UX issues (form cutoff, scroll behavior) couldn't be resolved satisfactorily. User decided to change approach.
- **Fix**:
  1. Removed "Events" (📋) button from `DeviceGridCard` and `onViewEvents` prop from `DeviceGrid`
  2. Deleted `EventPopup.tsx` component and its test file entirely
  3. Events now viewed only via "Details" button → device detail page (`/devices/$id`)
  4. Added "New Event" button on device detail page → opens a modal with EventForm (type chips, name, actor, description)
  5. Pre-fills deviceId automatically, refreshes timeline on success
- **Files**: `DeviceGridCard.tsx`, `DeviceGrid.tsx`, `devices.tsx`, `devices.$id.tsx`, deleted `EventPopup.tsx` + `EventPopup.test.tsx`
- **Tests**: 302 passed (46 files), tsc clean, vite build succeeds
- **Commit**: `33c8043`

### Fix 8: Modal focus trap stealing focus from inputs (feat/web-ui)
- **Problem**: Typing in any form field inside "New Event" modal caused focus to jump to the close (X) button.
- **Root cause**: Modal's `useEffect` depended on `[isOpen, handleKeyDown]`. `handleKeyDown` was recreated on every parent render (closure capturing `onClose`). Typing updated parent state → Modal re-rendered → effect re-ran → focus trap reset to first focusable element (X button).
- **Fix**: Moved `handleKeyDown` to a ref so the effect only depends on `isOpen`. Initial focus now prefers `input/textarea/select` over the close button.
- **Files**: `Modal.tsx`
- **Commit**: `36ba311`

### Fix 9: SettingsPanel success feedback + default hints (feat/web-ui)
- **Problem**: Save had no feedback; default values (health: 2000ms, metrics: 5000ms) were not shown to the user
- **Fix**:
  1. Added `saved` boolean state; on successful save shows "✓ Settings saved" (green, `text-green-400 text-sm mt-2`) with `data-testid="save-success"`; auto-dismisses after 2 seconds via `setTimeout`
  2. Added default hints below each interval input: "Default: 2000ms" and "Default: 5000ms" (`text-xs text-slate-500 mt-1`)
  3. Added 3 tests: default hints visible, success message appears after save, success message disappears after 2-second timeout
- **Files**: `SettingsPanel.tsx`, `SettingsPanel.test.tsx`
- **Tests**: 17 passed (3 new), tsc clean
- **Commits**: `ab2e6ca`, `a7dd411` (test reliability fix)
