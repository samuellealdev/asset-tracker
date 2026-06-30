# web-devices Specification

## Purpose
Full CRUD management of devices via `/devices` API endpoints.

## Requirements

### Requirement: Device List
The system MUST fetch and display all devices from GET /devices.

#### Scenario: Devices loaded
- GIVEN a valid JWT
- WHEN user navigates to /devices
- THEN a table displays id, name, type, status, last_seen for all devices

#### Scenario: Empty list
- GIVEN no devices exist
- THEN display "No devices found" with an "Add Device" CTA button

#### Scenario: Load error
- GIVEN GET /devices fails (network or server error)
- THEN display error message with a retry button

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
