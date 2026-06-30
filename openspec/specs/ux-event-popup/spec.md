# ux-event-popup Specification

## Purpose
Modal popup triggered from device cards, showing the event timeline and add-event form for a specific device.

## Requirements

### Requirement: Modal Behavior
The system MUST render event data in a modal overlay with focus trap, Escape-to-close, and click-outside-to-close.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Open from card | device card rendered | user clicks Events button | modal opens over the grid |
| Close via Escape | modal open | user presses Escape | modal closes, focus returns to trigger button |
| Close via overlay click | modal open | user clicks backdrop | modal closes |
| Focus trap | modal open | user tabs through elements | focus cycles within modal, never escapes to background |
| aria-modal | modal open | — | modal has aria-modal="true" and aria-label |

### Requirement: Event Timeline Display
The system MUST fetch and display events filtered by deviceId inside the popup.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Events loaded | popup opens for device X | GET /events?deviceId=X succeeds | timeline shows events sorted by timestamp desc |
| Loading state | popup opens | events are fetching | skeleton or spinner shown |
| Empty state | device has no events | events fetch returns [] | "No events for this device" message shown |
| Fetch error | GET /events?deviceId=X fails | — | error message with retry button inside popup |

### Requirement: Add Event Form in Popup
The system MUST render an event creation form inside the popup, with deviceId pre-bound.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Form pre-filled | popup opens for device X | form renders | device field shows device X name, is read-only |
| Successful creation | user fills type and message | submits form | POST /events succeeds, timeline refreshes, success toast |
| Validation error | user leaves type or message empty | submits form | inline validation errors, form not submitted |
| Creation error | user submits valid form | POST /events fails | error toast, form remains open for retry |

### Requirement: Popup Responsiveness
The popup MUST adapt to viewport size.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Desktop | viewport ≥ 1024px | popup opens | modal centered, max-width ~600px |
| Tablet/mobile | viewport < 1024px | popup opens | modal fills most of screen, still scrollable |
