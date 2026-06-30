# Proposal: UX Redesign — Top Navigation + Device Grid

## Intent

Current sidebar wastes horizontal space on widescreen. Health/metrics data is buried on a separate `/dashboards` page. Device list is a text-heavy table. Replace sidebar with a top bar and make live metrics glanceable everywhere. Switch from table to card grid for richer device browsing with inline actions.

## Scope

### In Scope
- TopBar with tab nav (Devices, Dashboards) + gear icon for settings
- LiveMetrics bar always visible (health dots, request/error counters)
- DeviceGrid (responsive cards) replacing DeviceTable
- DeviceGridCard actions: edit, delete, events
- EventPopup modal (timeline + add form) triggered from cards
- SettingsPanel slide-out from gear icon
- Reusable `Modal` component extracted from `DeleteDialog`
- Configurable polling: health 2s, metrics 5s (default)

### Out of Scope
- WebSocket real-time updates
- Device status field (API doesn't provide it)
- Dark/light toggle (already dark)
- Mobile-responsive redesign beyond current breakpoints
- Backend changes

## Capabilities

### New Capabilities
- `ux-topbar`: Top nav bar with tabs, live metrics, settings gear
- `ux-device-grid`: Device cards in responsive grid with inline actions
- `ux-event-popup`: Modal popup for device events (timeline + add form)
- `ux-settings-panel`: Slide-out panel for configuration
- `ux-live-metrics`: Always-visible metrics bar with configurable refresh

### Modified Capabilities
- `web-layout`: Sidebar removed → TopBar; live metrics in app shell; settings as slide-out
- `web-devices`: List changes from table to card grid; inline delete/events actions; event popup for per-device context
- `web-events`: Event creation available from device card popup
- `web-dashboards`: Health/metrics data promoted to always-visible LiveMetrics bar; shorter refresh intervals

## Approach

| Step | Component | What Changes |
|------|-----------|-------------|
| 1 | `Modal` (new shared) | Extract overlay, escape, focus trap from `DeleteDialog` |
| 2 | `TopBar` + `LiveMetrics` | New: tabs via TanStack `Link`, metrics inline, gear icon |
| 3 | `AppLayout` | Remove `Sidebar`; `Header` stays for logout; `TopBar` replaces nav |
| 4 | `DeviceGrid` + `DeviceGridCard` | New: CSS grid (`grid-cols-1 md:2 lg:3 xl:4`), card footer with actions |
| 5 | `EventPopup` | New: `Modal` wrapping `EventTimeline` + `EventForm` filtered by `deviceId` |
| 6 | `SettingsPanel` | New: slide-out panel, refresh interval controls stored in `localStorage` |
| 7 | Hooks | `useHealth`/`useMetrics` accept `refetchInterval` param; defaults: health 2s, metrics 5s |
| 8 | Devices route | Replace `DeviceTable` with `DeviceGrid`; wire `deleteTarget` → `DeviceGridCard` |

Remove: `Sidebar.tsx`, `DeviceTable.tsx`. Keep: `Header` (logout), `DeviceCard` (detail page unchanged), existing routes.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Event popup over-fetches if cards clicked rapidly | Low | Fetch only on open; TanStack Query cache deduplication |
| Layout regression on tablet breakpoints | Medium | Preserve existing responsive spec; test all 3 breakpoints |
| Settings panel accessibility | Low | Focus trap + Escape + `aria-modal` per Modal pattern |

## Rollback Plan

Revert `AppLayout` to restore `Sidebar`; swap `DeviceGrid` back to `DeviceTable`; remove `TopBar`, `LiveMetrics`, `SettingsPanel`, `EventPopup`, `Modal`; restore original `refetchInterval: 30_000`. All changes in `web-ui/src/` — no backend rollback needed.

## Success Criteria

- [ ] TopBar visible on all authenticated pages; sidebar absent
- [ ] LiveMetrics bar shows health dots + counters, refreshes at 2s/5s
- [ ] Device grid renders cards with edit/delete/events buttons
- [ ] Event popup opens from card, shows timeline, allows add
- [ ] Settings panel slides out from gear, configures intervals
- [ ] All existing tests pass; new components ≥70% coverage
- [ ] `web-dark-theme` spec scenarios still pass on new components
