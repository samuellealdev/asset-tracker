# Delta for web-devices

## ADDED Requirements

### Requirement: Deleted Devices Section

The system MUST display a "Deleted Devices" section below the active device grid on the Devices page, showing devices that were previously hard-deleted (event type `device.deleted`).

#### Scenario: Deleted devices loaded

- GIVEN deleted device events exist
- WHEN user navigates to /devices
- THEN a "Deleted Devices" heading is visible below the active device grid
- AND each deleted device is rendered as a card with muted styling (opacity-75)
- AND each card shows the device name, type badge, truncated ID, and deletion date
- AND each card shows a "Deleted" badge
- AND each card shows only a "Details" button (no Edit, no Delete, no Events)

#### Scenario: No deleted devices

- GIVEN no device.deleted events exist
- WHEN user navigates to /devices
- THEN the "Deleted Devices" heading is visible
- AND a "No deleted devices" empty state is displayed

#### Scenario: Loading state

- GIVEN the deleted devices query is loading
- THEN a loading skeleton is displayed in the deleted devices section

#### Scenario: Error state

- GIVEN the deleted devices query fails
- THEN an error message with a retry button is displayed in the deleted devices section

#### Scenario: Details button navigates to device

- GIVEN a deleted device card is rendered
- WHEN user clicks "Details"
- THEN user navigates to /devices/$id

### Requirement: Deleted Device Card Visual Style

Deleted device cards MUST be visually distinct from active device cards.

#### Scenario: Muted appearance

- GIVEN a deleted device card
- THEN the card has opacity-75
- AND the card has slightly muted colors compared to active cards
- AND a "Deleted" badge (red-tinted) is visible on the card

#### Scenario: Limited actions

- GIVEN a deleted device card
- THEN only a "Details" action button is rendered
- AND no Edit, Delete, or Events buttons are shown

#### Scenario: Deletion date shown

- GIVEN a deleted device card
- THEN the card shows the deletion timestamp instead of creation date
- AND the label reads "Deleted:" followed by the formatted date
