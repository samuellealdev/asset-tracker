# Tasks: UX Redesign — Top Navigation + Device Grid

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1400–1700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation + Layout (Modal, TopBar, LiveMetrics, SettingsPanel, AppLayout). PR 2: Device Grid + Event Popup (DeviceGridCard, DeviceGrid, EventPopup, routes). PR 3: Polish + Tests (E2E, cleanup, final verification). |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + Layout shell (Modal, TopBar, LiveMetrics, SettingsPanel, AppLayout, Header) | PR 1 | ~500 changed lines; standalone verification: TopBar renders, Sidebar absent, dashboards page still loads |
| 2 | Device Grid + Event Popup (DeviceGridCard, DeviceGrid, EventPopup, devices route) | PR 2 | ~450 changed lines; depends on PR 1 for Modal; standalone verification: card grid visible, events popup works |
| 3 | Polish + Tests + Deletes (dashboards cleanup, settings route delete, E2E, vitest, tsc) | PR 3 | ~350 changed lines; depends on PR 1+2; final verification pass |

## Phase 1: Foundation

- [x] 1.1 Create `src/components/shared/Modal.tsx` — portal-based modal with backdrop, focus trap (tab cycle), Escape-to-close, `aria-modal="true"`, click-outside-to-close. Props: `isOpen`, `onClose`, `children`, `title?`. TDD: create `src/components/shared/__tests__/Modal.test.tsx` first (portal rendering, focus trap, Escape key, backdrop click, aria-modal attr, title rendering).
- [x] 1.2 Refactor `src/components/devices/DeleteDialog.tsx` — remove inline overlay/focus/Escape logic (lines 1-42, 47-58), render content inside `<Modal>`. Update `src/components/devices/__tests__/DeleteDialog.test.tsx` to verify Modal wrapper usage.
- [x] 1.3 Create `src/hooks/use-settings.ts` — `useSettings()` reads/writes `healthInterval` (default 2000) and `metricsInterval` (default 5000) from localStorage. Methods: `updateHealthInterval(ms)`, `updateMetricsInterval(ms)`. Handle invalid input gracefully (NaN/negative → ignore, keep previous). TDD: create `src/hooks/__tests__/use-settings.test.tsx` first.
- [x] 1.4 Modify `src/hooks/use-health.ts` — add optional `refetchInterval?` param to `useGoHealth()` and `useNodeHealth()`. Default 2000ms. Update `src/hooks/__tests__/use-health.test.tsx` to verify interval pass-through and default fallback.
- [x] 1.5 Modify `src/hooks/use-metrics.ts` — add optional `refetchInterval?` param to `useGoMetrics()` and `useNodeMetrics()`. Default 5000ms. Update `src/hooks/__tests__/use-metrics.test.tsx` similarly.

## Phase 2: Layout

- [x] 2.1 Create `src/components/layout/TopBar.tsx` — horizontal bar with NavTabs (Devices, Dashboards via TanStack `Link` + `useMatchRoute` for active highlighting), settings gear icon (toggles SettingsPanel), logout button (calls `useAuth().logout()` + `navigate({ to: "/login" })`). Responsive: desktop full row, tablet compact, mobile horizontal scroll. TDD: created `src/components/layout/__tests__/TopBar.test.tsx` first (8 tests).
- [x] 2.2 Create `src/components/layout/LiveMetrics.tsx` — consumes `useSettings()` for intervals. Renders health dots (green/red) for Go (:8080) and Node (:3000) via `useGoHealth(healthInterval)` / `useNodeHealth(healthInterval)`, and request/error counters via `useGoMetrics(metricsInterval)` / `useNodeMetrics(metricsInterval)`. Compact layout: health dots + counters in single row. TDD: created `src/components/layout/__tests__/LiveMetrics.test.tsx` first (9 tests).
- [x] 2.3 Create `src/components/layout/SettingsPanel.tsx` — `createPortal` slide-out from right. Contains: API URLs (readonly), auth status display, token preview, logout button. Closes via X button, Escape key, or backdrop click. TDD: created `src/components/layout/__tests__/SettingsPanel.test.tsx` first (10 tests).
- [x] 2.4 Modify `src/components/layout/AppLayout.tsx` — removed `Sidebar` import and usage, removed mobile hamburger button. Added `<TopBar>`, `<LiveMetrics>`, `<SettingsPanel>`. Modified `src/components/layout/Header.tsx` to remove logout button. Updated `src/components/layout/__tests__/AppLayout.test.tsx` and `src/components/layout/__tests__/Header.test.tsx`.
- [x] 2.5 Delete `src/components/layout/Sidebar.tsx` and `src/components/layout/__tests__/Sidebar.test.tsx`.

## Phase 3: Device Grid

- [x] 3.1 Create `src/components/devices/DeviceGridCard.tsx` — card with device name (bold, truncated at 30 chars + ellipsis), type badge, last_seen (relative time), and footer actions (Edit → `/devices/$id`, Delete → onDelete callback, Events → onEvents callback). Handle null type/last_seen ("Unknown"/"Never"). Hover: actions become visible. TDD: create `src/components/devices/__tests__/DeviceGridCard.test.tsx` first.
- [x] 3.2 Create `src/components/devices/DeviceGrid.tsx` — responsive CSS grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Props: `devices`, `isLoading`, `isError`, `onRetry`, `onDelete`, `onEvents`. Loading → skeleton cards. Empty → "No devices found" + CTA. Error → message + retry button. TDD: create `src/components/devices/__tests__/DeviceGrid.test.tsx` first.
- [x] 3.3 Modify `src/routes/devices.tsx` — replace `DeviceTable` with `DeviceGrid`. Add `EventPopup` state (`eventDeviceId`, `eventDeviceName`). Wire delete flow through cards. Keep DeleteDialog rendered. Update `src/routes/__tests__/devices.test.tsx`.
- [x] 3.4 Delete `src/components/devices/DeviceTable.tsx` and `src/components/devices/__tests__/DeviceTable.test.tsx`.

## Phase 4: Event Popup

- [ ] 4.1 Create `src/components/events/EventPopup.tsx` — `<Modal>` wrapping `<EventTimeline>` (GET /events?deviceId=X) and `<EventForm>` (deviceId pre-bound, read-only device field). Props: `deviceId`, `deviceName`, `isOpen`, `onClose`. Loading/empty/error states per spec. On successful event creation, refresh timeline + show success toast. TDD: create `src/components/events/__tests__/EventPopup.test.tsx` first.
- [ ] 4.2 Update `DeviceGridCard.tsx` — wire Events button to call `onEvents(device.id, device.name)` which opens EventPopup in `devices.tsx`.

## Phase 5: Polish

- [ ] 5.1 Modify `src/routes/dashboards.tsx` — remove health/metrics live sections (now in LiveMetrics bar). Keep summary/detail overview if applicable. Update `src/routes/__tests__/dashboards.test.tsx`.
- [ ] 5.2 Delete route `src/routes/settings.tsx` and `src/routes/__tests__/settings.test.tsx`. Remove `/settings` from route tree (regenerate `routeTree.gen.ts`).
- [ ] 5.3 Update E2E tests in `web-ui/e2e/devices.spec.ts` — verify card grid renders instead of table, Events button opens EventPopup, delete from card triggers confirmation.
- [ ] 5.4 Update E2E tests in `web-ui/e2e/dashboards.spec.ts` — verify dashboards page renders (simplified content), no test regressions.
- [ ] 5.5 Final verification: run `cd web-ui && npx vitest run` (all unit + integration), `npx tsc --noEmit` (type check), and `npx playwright test` (E2E). Ensure 0 failures and ≥70% coverage.
