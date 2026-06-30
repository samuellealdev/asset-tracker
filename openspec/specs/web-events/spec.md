# web-events Specification

## Purpose
Event listing and manual creation via Node.js `/events` endpoints (no auth required). Events can also be viewed and created per-device via modal popup from the device card grid.

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

### Requirement: Event Popup from Device Card
The system MUST allow viewing and creating events for a specific device via a modal popup triggered from the device card grid.

#### Scenario: Popup opens with device filter
- GIVEN user clicks the Events button on a device card
- WHEN the EventPopup opens
- THEN the event timeline is filtered to that deviceId, and "Add Event" form is pre-bound to that device

#### Scenario: Close popup
- GIVEN the EventPopup modal is open
- WHEN user clicks outside the modal, presses Escape, or clicks a close button
- THEN the modal closes, device grid is visible again

#### Scenario: Popup load error
- GIVEN GET /events?deviceId=X fails
- THEN the popup displays error message with retry button

#### Scenario: Popup empty state
- GIVEN the device has no events
- THEN the popup shows "No events for this device" with the add-event form available

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
The system MUST pre-select the device when the event creation form is opened from a device card popup.

(Previously: dropdown populated but requires manual device selection)

#### Scenario: Device pre-selected in popup form
- GIVEN the EventPopup is opened from a device card
- WHEN the add-event form renders inside the popup
- THEN the device field is pre-filled and read-only (or hidden) with the originating deviceId

#### Scenario: Standalone events page unchanged
- GIVEN user navigates to /events directly
- WHEN the event creation form renders
- THEN the device dropdown behaves as before, requiring manual selection

#### Scenario: Dropdown populated
- GIVEN the event creation form renders
- WHEN devices are fetched
- THEN the device dropdown lists all available devices
