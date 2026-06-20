# Delta for web-events

## ADDED Requirements

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

## MODIFIED Requirements

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
