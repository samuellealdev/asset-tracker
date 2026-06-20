# ux-topbar Specification

## Purpose
Top navigation bar with tabs, live metrics integration, settings access, and logout. Replaces the removed Sidebar.

## Requirements

### Requirement: Tab Navigation
The system MUST render tabs (Devices, Dashboards) using TanStack Router links with active-tab highlighting.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Desktop tabs | viewport ≥ 1024px | app renders | tabs visible, active route highlighted |
| Tablet tabs | viewport 768-1023px | app renders | tabs visible with compact spacing |
| Tab click | user on /dashboards | clicks Devices tab | navigates to /devices, Devices tab highlighted |
| Active state | route is /devices | app renders | Devices tab has active style, Dashboards tab does not |

### Requirement: Settings Gear
The system MUST render a gear icon that opens the SettingsPanel slide-out.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Gear visible | authenticated user | TopBar renders | gear icon button visible |
| Opens panel | gear icon visible | user clicks gear | SettingsPanel slides out from right |
| Panel closes | SettingsPanel open | user clicks gear again | SettingsPanel slides closed |

### Requirement: Logout Button
The system MUST render a logout button in the TopBar that clears JWT and redirects to /login.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Logout action | authenticated user | clicks logout | JWT cleared, redirected to /login |
| Logout visible | authenticated user | TopBar renders | logout button visible |

### Requirement: Responsive Behavior
The system MUST adapt TopBar layout for desktop (≥1280px), tablet (≥768px), and mobile (<768px).

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Desktop layout | viewport ≥ 1280px | TopBar renders | horizontal tabs + metrics + gear + logout in single row |
| Tablet layout | viewport 768-1279px | TopBar renders | compressed spacing, all elements accessible |
| Mobile layout | viewport < 768px | TopBar renders | tabs stack or scroll horizontally |
