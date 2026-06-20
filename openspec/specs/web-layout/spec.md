# web-layout Specification

## Purpose
App shell providing navigation, routing, error boundary, and responsive design.

## Requirements

### Requirement: Navigation
The system MUST provide a persistent sidebar with links: Devices, Events, Dashboards, Settings.

#### Scenario: Desktop navigation
- GIVEN viewport width ≥ 1024px
- WHEN app renders
- THEN sidebar is visible with active-route highlighting

#### Scenario: Tablet navigation
- GIVEN viewport width between 768px and 1023px
- WHEN app renders
- THEN a hamburger menu opens a navigation drawer

### Requirement: Routing
The system MUST route using TanStack Router for: /, /devices, /events, /dashboards, /settings.

#### Scenario: Defined routes
- GIVEN any defined route URL
- WHEN user navigates to it
- THEN the correct page component renders

#### Scenario: Unknown route
- GIVEN an undefined route URL
- THEN "Page Not Found" is displayed with a link back to home

### Requirement: Layout Structure
The system MUST render a header (app title + logout), sidebar/nav, and main content area consistently.

#### Scenario: Layout persistence
- GIVEN user navigates between pages
- THEN header and sidebar remain unchanged, only main content updates

### Requirement: Error Boundary
The system MUST catch unhandled render errors and display a fallback UI.

#### Scenario: Component crash
- GIVEN a page component throws an error
- THEN "Something went wrong" is displayed with a retry button

### Requirement: Responsive Breakpoints
The system MUST support desktop (≥1280px) and tablet (≥768px) viewports.

#### Scenario: Desktop layout
- GIVEN viewport ≥ 1280px
- THEN layout uses a fully visible sidebar with wide content area

#### Scenario: Tablet layout
- GIVEN viewport ≥ 768px and < 1280px
- THEN layout uses a collapsible sidebar, content remains readable
