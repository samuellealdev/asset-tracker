# web-events Specification

## Purpose
Event listing and manual creation via Node.js `/events` endpoints (no auth required).

## Requirements

### Requirement: Event List
The system MUST fetch and display events from GET /events, with optional device filter.

#### Scenario: Events loaded
- GIVEN user navigates to /events
- WHEN GET /events returns data
- THEN a table displays timestamp, device, type, and message for each event

#### Scenario: Filter by device
- GIVEN user selects a device from the filter dropdown
- WHEN GET /events?deviceId=X is called
- THEN only events for that device are displayed

#### Scenario: Empty state
- GIVEN no events exist or filter returns zero results
- THEN display "No events found" empty state

#### Scenario: Load error
- GIVEN GET /events fails
- THEN display error message with retry button

### Requirement: Manual Event Creation
The system MUST create events via POST /events with a validated form.

#### Scenario: Successful submission
- GIVEN a completed form (device, type, message)
- WHEN submitted
- THEN POST /events succeeds, event list refreshes, success toast appears

#### Scenario: Validation failure
- GIVEN required fields are empty
- WHEN form is submitted
- THEN inline validation errors appear, form is not submitted

### Requirement: Device Selector
The system MUST fetch the device list from GET /devices to populate the event form device dropdown.

#### Scenario: Dropdown populated
- GIVEN the event creation form renders
- WHEN devices are fetched
- THEN the device dropdown lists all available devices
