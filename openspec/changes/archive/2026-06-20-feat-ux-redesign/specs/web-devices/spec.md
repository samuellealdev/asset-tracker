# Delta for web-devices

## ADDED Requirements

### Requirement: Device Grid Actions
The system MUST render inline edit, delete, and events action buttons on each device card in the grid.

#### Scenario: Actions visible on card
- GIVEN device cards are rendered in the grid
- THEN each card footer shows Edit, Delete, and Events action buttons

#### Scenario: Events action opens popup
- GIVEN user clicks the Events button on a device card
- THEN the EventPopup modal opens for that device, filtered by deviceId

#### Scenario: Delete from card triggers confirmation
- GIVEN user clicks the Delete button on a device card
- THEN delete confirmation dialog opens, deviceId pre-bound

#### Scenario: Edit from card navigates to detail
- GIVEN user clicks the Edit button on a device card
- THEN user navigates to device detail edit view

## MODIFIED Requirements

### Requirement: Device List
The system MUST fetch and display all devices from GET /devices in a responsive CSS grid of device cards.

(Previously: display in a table)

#### Scenario: Devices loaded
- GIVEN a valid JWT
- WHEN user navigates to /devices
- THEN a responsive CSS grid displays device cards with name, type, status, last_seen

#### Scenario: Empty list
- GIVEN no devices exist
- THEN display "No devices found" with an "Add Device" CTA button

#### Scenario: Load error
- GIVEN GET /devices fails
- THEN display error message with a retry button

#### Scenario: Responsive grid columns
- GIVEN viewport ≥ 1024px (desktop)
- THEN grid renders 3-4 columns of device cards
- GIVEN viewport between 768px and 1023px (tablet)
- THEN grid renders 2 columns of device cards
- GIVEN viewport < 768px (mobile)
- THEN grid renders 1 column of device cards
