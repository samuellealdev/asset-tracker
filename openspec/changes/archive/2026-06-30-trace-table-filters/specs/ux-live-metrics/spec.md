# Delta for ux-live-metrics

## ADDED Requirements

### Requirement: Method Filter Chips

The filter bar MUST render single-select method toggle chips (All, GET, POST, PUT, DELETE). Clicking a chip selects it and deselects others. Clicking the already-selected chip deselects all, reverting to "All". Only traces matching the selected method SHALL be shown.

#### Scenario: Select method chip

- GIVEN trace table with 10 GET and 5 POST traces
- WHEN user clicks the "POST" chip
- THEN only 5 POST traces are shown; "POST" chip is highlighted

#### Scenario: Deselect chip to show all

- GIVEN "POST" chip is selected and highlighted
- WHEN user clicks the "POST" chip again
- THEN all 15 traces shown; no chip is highlighted

#### Scenario: Switch method

- GIVEN "POST" chip selected, showing only POST traces
- WHEN user clicks "DELETE" chip
- THEN only DELETE traces shown; "DELETE" highlighted; "POST" deselected

### Requirement: Error-Only Toggle

The filter bar MUST include a toggle that filters traces to those with `status >= 400`. The toggle operates independently of other filters. When combined with a method filter, it SHALL show only errors for that method.

#### Scenario: Toggle errors on

- GIVEN 10 traces: 3 with status >= 400, 7 with status < 400
- WHEN user enables error-only toggle
- THEN only 3 error traces shown; toggle indicates active state

#### Scenario: Toggle errors off

- GIVEN error-only toggle active, showing 3 error traces
- WHEN user disables the toggle
- THEN all 10 traces shown; toggle indicates inactive state

#### Scenario: Combine error with method filter

- GIVEN 3 POST traces (1 error) and 2 GET traces (1 error)
- WHEN user selects "POST" chip AND enables error-only toggle
- THEN only the 1 POST error trace is shown

### Requirement: Path Search

The filter bar MUST include a text input that filters traces by case-insensitive substring match on the `path` field. Filtering SHALL apply in real-time as the user types.

#### Scenario: Partial path match

- GIVEN traces with paths "/api/users", "/api/assets", "/health"
- WHEN user types "user" in path search
- THEN only the "/api/users" trace is shown

#### Scenario: Case-insensitive match

- GIVEN a trace with path "/API/Users"
- WHEN user types "users"
- THEN the trace is shown (case-insensitive substring match)

#### Scenario: Empty search restores full view

- GIVEN path search contains "user", showing filtered results
- WHEN user clears the search input
- THEN all traces are shown

#### Scenario: Combine path with method filter

- GIVEN GET "/api/users" and POST "/api/users" traces
- WHEN user selects "POST" chip AND types "users"
- THEN only the POST "/api/users" trace is shown

### Requirement: Clear All Filters

The filter bar MUST include a "Clear all" control that resets every filter to its default: All methods, error-only off, empty path search. The control SHALL be visible only when at least one filter is active.

#### Scenario: Clear all resets every filter

- GIVEN POST chip selected, error-only on, path search has "api"
- WHEN user clicks "Clear all"
- THEN all traces shown; no chip selected; error toggle off; search empty

#### Scenario: Clear all hidden at defaults

- GIVEN no filters are active
- WHEN filter bar renders
- THEN "Clear all" is not visible

### Requirement: Active Filter Count Badge

The filter bar MUST display a badge showing the number of active filters. A filter is active when it deviates from its default value. The badge SHALL be hidden when zero filters are active.

#### Scenario: One active filter

- GIVEN user selected "POST" method chip, no other filters active
- WHEN filter bar renders
- THEN badge shows "1"

#### Scenario: Multiple active filters

- GIVEN user selected "DELETE" chip, enabled error-only, typed "api"
- WHEN filter bar renders
- THEN badge shows "3"

#### Scenario: Badge hidden at defaults

- GIVEN all filters at their default values
- WHEN filter bar renders
- THEN badge is not visible

### Requirement: Filter State Reset on Context Change

Filter state MUST reset to defaults when the ServiceDetailCard modal closes or when the selected service changes.

#### Scenario: Reset on modal close

- GIVEN user has "POST" chip selected in the Go service modal
- WHEN user closes the modal
- AND reopens the Go service modal
- THEN all filters are at defaults

#### Scenario: Reset on service switch

- GIVEN Go service modal open with "POST" method selected
- WHEN user opens the Node service modal
- THEN the Node modal shows all filters at defaults

## MODIFIED Requirements

### Requirement: ServiceDetailCard Trace Table

`ServiceDetailCard` modal MUST render a filter bar above the trace table with: method chips (All, GET, POST, PUT, DELETE), error-only toggle, path search input, clear-all link, and active-count badge. Below the filter bar, the scrollable trace table (`max-h-48 overflow-y-auto`) renders beneath health/counters. Columns: Method (colored badge), Path, Status (green for <400, red for >=400), Duration (ms), Timestamp. Error rows (status >=400) MUST have `border-l-2 border-red-500`. Empty state: "No recent requests" when zero traces returned from backend; "No matching requests" when filters are active but no traces match.

(Previously: Trace table rendered without a filter bar and used a single "No recent requests" empty state for all cases.)

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Table renders | 15 traces | modal opens | filter bar visible above newest-first table, all columns rendered |
| Method badges | GET/POST/DELETE/PUT traces | table renders | blue/green/red/orange badges |
| Status colors | 200 vs 500 | table renders | green for 200, red for 500 |
| Error row border | status >= 400 | row renders | red left-border applied |
| Scroll overflow | 50+ traces | modal renders | container scrolls, header fixed |
| Empty state — no data | zero traces returned from backend | modal opens | "No recent requests" shown |
| Empty state — filters active | POST chip selected, no POST traces exist | modal renders | "No matching requests" shown |
