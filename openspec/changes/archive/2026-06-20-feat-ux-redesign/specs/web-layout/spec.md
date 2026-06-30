# Delta for web-layout

## ADDED Requirements

### Requirement: TopBar Integration
The system MUST render a TopBar component in the app shell, replacing the removed Sidebar.

(Previously: no TopBar existed)

#### Scenario: TopBar visible on authenticated pages
- GIVEN a valid JWT
- WHEN any authenticated page renders
- THEN TopBar is visible at the top of the layout

#### Scenario: TopBar hidden on login page
- GIVEN user is on /login
- THEN TopBar is not rendered

## MODIFIED Requirements

### Requirement: Navigation
The system MUST provide a persistent TopBar with tabs (Devices, Dashboards), a settings gear icon, and a logout button.

(Previously: sidebar with links: Devices, Events, Dashboards, Settings)

#### Scenario: Desktop navigation
- GIVEN viewport width ≥ 1024px
- WHEN app renders
- THEN TopBar tabs are visible with active-tab highlighting

#### Scenario: Tablet navigation
- GIVEN viewport width between 768px and 1023px
- WHEN app renders
- THEN TopBar renders in compact mode, tabs remain accessible

### Requirement: Layout Structure
The system MUST render a header, TopBar, and main content area consistently. Sidebar is removed.

(Previously: header, sidebar, and main content area)

#### Scenario: Layout persistence
- GIVEN user navigates between pages
- THEN header and TopBar remain unchanged, only main content updates

### Requirement: Responsive Breakpoints
The system MUST support desktop (≥1280px) and tablet (≥768px) viewports. TopBar adapts horizontally.

(Previously: sidebar layout for both breakpoints)

#### Scenario: Desktop layout
- GIVEN viewport ≥ 1280px
- THEN TopBar renders full horizontal tabs, content fills remaining space

#### Scenario: Tablet layout
- GIVEN viewport ≥ 768px and < 1280px
- THEN TopBar renders with compact spacing, content remains readable
