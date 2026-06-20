# Design: UX Redesign — Top Navigation + Device Grid

## Technical Approach

Replace sidebar with top nav (tabs, live metrics, settings gear). Convert device table to responsive card grid with inline actions. Extract reusable `Modal` from `DeleteDialog` via `createPortal`. `EventPopup` consumes `Modal` for per-device event timeline + creation. Hooks accept configurable `refetchInterval` (health 2s, metrics 5s defaults).

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Modal rendering | Inline vs `createPortal` | `createPortal` | Avoids z-index stacking conflicts; DeleteDialog currently inline — portal fixes this. |
| Settings storage | Context vs Zustand vs localStorage | `localStorage` + `useSettings` | Only `LiveMetrics` consumes intervals; no cross-component reactivity needed. |
| Card actions | Dropdown vs visible footer | Footer with hover emphasis | Spec requires edit/delete/events buttons per card. |
| Interval injection | Context vs hook parameter | Hook parameter with default | `useGoHealth(refetchInterval?)` — follows existing pattern, no dependency on settings system. |

## Data Flow

```
TopBar
├── NavTabs (Devices, Dashboards via TanStack Link)
├── LiveMetrics ← use{Go,Node}{Health,Metrics}(refetchInterval) → /api/{go,node}/health, /metrics
├── SettingsGear → SettingsPanel (createPortal slide-out) ← useSettings() → localStorage
└── LogoutButton ← useAuth().logout()

DevicesPage
├── DeviceGrid (grid-cols-1 md:2 lg:3 xl:4) ← useDevices()
│   └── DeviceGridCard → Edit(→/$id), Delete(→DeleteDialog), Events(→EventPopup)
├── DeleteDialog (refactored, wraps <Modal>)
└── EventPopup (Modal wrapping EventTimeline + EventForm, deviceId pre-bound)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/shared/Modal.tsx` | Create | Portal modal: backdrop, focus trap, Escape, `aria-modal`. Props: `isOpen`, `onClose`, `children`, `title?`. |
| `src/components/devices/DeleteDialog.tsx` | Modify | Remove inline overlay/focus/Escape logic. Render content inside `<Modal>`. |
| `src/components/layout/TopBar.tsx` | Create | Horizontal bar: NavTabs, LiveMetrics, settings gear, logout. |
| `src/components/layout/LiveMetrics.tsx` | Create | Health dots + request/error counters per service. Uses hooks with interval from `useSettings()`. |
| `src/components/layout/SettingsPanel.tsx` | Create | Slide-out panel: interval inputs, API URLs, auth status, logout. `createPortal`. |
| `src/components/devices/DeviceGrid.tsx` | Create | Responsive CSS grid. Loading (skeleton), empty, error states. Props: `devices`, `isLoading`, `isError`, `onRetry`, `onDelete`, `onEvents`. |
| `src/components/devices/DeviceGridCard.tsx` | Create | Card: name, type badge, last_seen, footer actions. Props: `device`, `onEdit`, `onDelete`, `onEvents`. |
| `src/components/events/EventPopup.tsx` | Create | `<Modal>` + `<EventTimeline>` + `<EventForm>`. Props: `deviceId`, `deviceName`, `isOpen`, `onClose`. |
| `src/components/layout/AppLayout.tsx` | Modify | Remove `Sidebar`, add `TopBar`. Remove mobile hamburger. |
| `src/components/layout/Sidebar.tsx` | Delete | Replaced. |
| `src/components/devices/DeviceTable.tsx` | Delete | Replaced. |
| `src/hooks/use-health.ts` | Modify | `useGoHealth(refetchInterval?)`, `useNodeHealth(refetchInterval?)` — default 2000ms. |
| `src/hooks/use-metrics.ts` | Modify | `useGoMetrics(refetchInterval?)`, `useNodeMetrics(refetchInterval?)` — default 5000ms. |
| `src/hooks/use-settings.ts` | Create | `useSettings()` reads/writes `healthInterval`/`metricsInterval` from localStorage. |
| `src/routes/devices.tsx` | Modify | Replace `DeviceTable` with `DeviceGrid`. Add `EventPopup` state. Wire `DeleteDialog` to cards. |
| `src/routes/dashboards.tsx` | Modify | Simplify; health/metrics now in TopBar. Keep summary/detail view. |
| `src/routes/settings.tsx` | Delete | Replaced by `SettingsPanel`. Remove `/settings` route. |
| `src/routes/events.tsx` | No change | Standalone page preserved. |

## Interfaces

```typescript
// Modal
interface ModalProps { isOpen: boolean; onClose: () => void; children: ReactNode; title?: string; }

// useHealth / useMetrics — updated signatures
function useGoHealth(refetchInterval?: number): UseQueryResult<HealthResponse>;
function useGoMetrics(refetchInterval?: number): UseQueryResult<MetricsData>;
// (useNodeHealth, useNodeMetrics follow same pattern)

// useSettings
function useSettings(): {
  healthInterval: number;     // ms, default 2000
  metricsInterval: number;    // ms, default 5000
  updateHealthInterval(ms: number): void;
  updateMetricsInterval(ms: number): void;
};
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Modal (portal, focus trap, Escape, backdrop click, `aria-modal`) | Vitest + Testing Library |
| Unit | TopBar (tabs, active highlighting, gear toggle, logout) | Mock Router `Link`/`useMatchRoute`, verify callbacks |
| Unit | DeviceGridCard (fields, actions, hover, null values) | Mock `Device`, `userEvent.click` |
| Unit | LiveMetrics (dots, counters, interval pass-through) | Mock hooks |
| Unit | useHealth/useMetrics (interval param, defaults) | `renderHook` + verify query args |
| Unit | useSettings (localStorage R/W, defaults, invalid input) | Direct localStorage in test |
| Integration | AppLayout (TopBar present, Sidebar absent, login excludes bar) | Render w/ AuthProvider + RouterProvider |
| Integration | DevicesPage (grid renders, EventPopup open/close, delete flow) | Mock API |
| E2E | Card grid instead of table, Events button opens popup, delete from card | Playwright: update `devices.spec.ts` |
| E2E | Top nav tabs, settings gear panel | New E2E test |

## Migration

No data migration. UI-only, `web-ui/src/`. Rollback: restore `Sidebar` in `AppLayout`, swap `DeviceGrid` → `DeviceTable`, remove new components, restore `refetchInterval: 30_000`.

## Open Questions

- `LiveMetrics` intervals: consume via `useSettings()` directly or via React context injected by `AppLayout`? Start with `useSettings()`; extract to context only if cross-component sync beyond localStorage becomes needed.
