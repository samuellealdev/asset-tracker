# web-devices Specification

## Purpose
Full CRUD management of devices via `/devices` API endpoints. Device list displays in a responsive CSS grid of cards.

## Requirements

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
- GIVEN GET /devices fails (network or server error)
- THEN display error message with a retry button

#### Scenario: Responsive grid columns
- GIVEN viewport ≥ 1024px (desktop)
- THEN grid renders 3-4 columns of device cards
- GIVEN viewport between 768px and 1023px (tablet)
- THEN grid renders 2 columns of device cards
- GIVEN viewport < 768px (mobile)
- THEN grid renders 1 column of device cards

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

### Requirement: Device Detail
The system MUST display full device details via GET /devices/:id.

#### Scenario: Device found
- GIVEN user clicks a device from the list
- WHEN GET /devices/:id succeeds
- THEN all device fields are displayed in a detail card

#### Scenario: Device not found
- GIVEN a nonexistent device ID
- WHEN GET /devices/:id returns 404
- THEN display "Device not found" error state

### Requirement: Device Create
The system MUST create devices via POST /devices using Zod-validated form fields.

#### Scenario: Successful creation
- GIVEN a completed form with valid data
- WHEN submitted
- THEN POST /devices succeeds, redirect to device detail with success toast

#### Scenario: Validation errors
- GIVEN form fields are invalid (empty name, invalid type)
- WHEN submitted
- THEN inline validation errors appear, form is not submitted

### Requirement: Device Edit
The system MUST update devices via PUT /devices/:id with a pre-filled form.

#### Scenario: Successful edit
- GIVEN the device detail page
- WHEN user clicks "Edit", modifies fields, and submits
- THEN PUT /devices/:id succeeds, redirect to detail view

### Requirement: Device Delete
The system MUST delete devices via DELETE /devices/:id after user confirmation.

#### Scenario: Confirmed deletion
- GIVEN the device detail page
- WHEN user clicks "Delete" and confirms in dialog
- THEN DELETE /devices/:id is called, redirect to list with success toast

#### Scenario: Cancelled deletion
- GIVEN the confirmation dialog is open
- WHEN user clicks "Cancel"
- THEN device is not deleted, dialog closes

### Requirement: Deleted Devices Section (Toggle)

The system MUST display a "Deleted Devices" section below the active device grid on the Devices page, showing devices that were previously hard-deleted (event type `device.deleted`). The section MUST be visually distinct from the active device grid using a "Red Ledger" aesthetic: red left-border accent (`border-l-2 border-l-rose-600/40`) and subtle red-tinted gradient background. Each deleted device card MUST render with muted opacity, a thin red left accent, a red "Deleted" badge with Trash2 icon, and display "Deleted:" as the date label (replacing "Created:"). The section MUST be hidden by default with a toggle button to show/hide it. During data refresh, the system MUST replace device cards with skeleton placeholders matching the responsive grid layout and red-tinted background, and MUST keep the toggle button visible with the stale device count.

#### Scenario: Section hidden by default

- GIVEN deleted device events exist
- WHEN user navigates to /devices
- THEN a "Deleted Devices" heading is NOT visible
- AND a toggle button is displayed: "Show deleted devices (N)" where N is the count

#### Scenario: Toggle shows deleted devices

- GIVEN the toggle button is visible
- WHEN user clicks the toggle
- THEN the deleted devices section slides in with animation
- AND the section wrapper displays a red left-border accent and subtle red-tinted background
- AND each deleted device card renders with muted opacity and a thin red left accent
- AND each card displays a red "Deleted" badge with a Trash2 icon
- AND each card shows "Deleted:" as the date label instead of "Created:"
- AND each card shows only a "Details" button (no Edit, no Delete)
- AND the button text changes to "Hide deleted devices"

#### Scenario: Toggle hides section

- GIVEN the deleted devices section is visible
- WHEN user clicks "Hide deleted devices"
- THEN the section slides out with animation
- AND the button text reverts to "Show deleted devices (N)"

#### Scenario: No deleted devices

- GIVEN no device.deleted events exist
- THEN no toggle button is displayed
- AND the "Deleted Devices" section shows an empty state

#### Scenario: Initial load

- GIVEN the deleted devices query is loading for the first time (no cached data)
- THEN a loading skeleton is displayed in the deleted devices section with red-tinted background matching the section styling

#### Scenario: Refresh loading

- GIVEN deleted devices data already exists and is displayed
- WHEN the query re-fetches (data is being refreshed)
- THEN skeleton cards matching the responsive grid layout and red-tinted background replace the device cards in the grid area
- AND the toggle button remains visible showing the stale device count
- AND no spinner or loading indicator appears inside the toggle button

#### Scenario: Error state

- GIVEN the deleted devices query fails
- THEN an error message with a retry button is displayed

#### Scenario: Details navigates to device detail

- GIVEN a deleted device card is rendered
- WHEN user clicks "Details"
- THEN user navigates to /devices/$id
