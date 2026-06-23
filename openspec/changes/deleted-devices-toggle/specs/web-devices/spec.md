# Delta for web-devices — Toggle Deleted Devices

## REPLACED Requirements

The following delta requirements from `2026-06-23-deleted-devices-grid` are replaced:

### Requirement: Deleted Devices Visual Style (REPLACED)

Old: Deleted device cards MUST be visually distinct (opacity-75, muted colors, "Deleted" badge).

New: Deleted device cards MUST render identically to active device cards. No opacity, no badge, no muted styling.

#### Scenario: Identical card styling
- GIVEN a deleted device card is rendered in the deleted devices section
- THEN the card uses `DeviceGridCard` with the same border, background, and opacity as active cards
- AND no "Deleted" badge or red-tinted elements appear on the card
- AND the card shows creation date (same as active cards) instead of deletion date

### Requirement: Deleted Devices Default Visibility (REPLACED)

Old: Deleted devices section always visible below active grid.

New: The deleted devices section MUST be hidden by default. A toggle button controls visibility.

#### Scenario: Section hidden by default
- GIVEN user navigates to /devices
- WHEN no deleted devices exist
- THEN no toggle button or deleted devices section is displayed
- WHEN deleted devices exist
- THEN a toggle button is displayed at the bottom: "Show deleted devices (N)" where N is the count
- AND the deleted devices section is hidden

#### Scenario: Toggle shows section
- GIVEN the toggle button says "Show deleted devices (N)"
- WHEN user clicks the toggle
- THEN the deleted devices section slides in with animation (transition-all duration-300)
- AND the button text changes to "Hide deleted devices"

#### Scenario: Toggle hides section
- GIVEN the deleted devices section is visible
- WHEN user clicks the toggle button ("Hide deleted devices")
- THEN the section slides out with animation
- AND the button text changes back to "Show deleted devices (N)"

### Requirement: Deleted Device Actions (REPLACED)

Old: Deleted card shows "Details" button with a custom DeletedDeviceCard.

New: Deleted cards use `DeviceGridCard` with only the "Details" button rendered (no Edit, no Delete).

#### Scenario: Only Details action
- GIVEN a deleted device card is rendered
- THEN the card footer shows only the "Details" button
- AND no "Edit", "Delete", or "Events" buttons are visible

#### Scenario: Details navigates to device detail
- GIVEN a deleted device card
- WHEN user clicks "Details"
- THEN user navigates to /devices/$id

## REMOVED Requirements

The following scenarios from the archived delta are removed:

- Deleted card has opacity-75 → removed
- Deleted card has muted colors → removed
- "Deleted" badge (red-tinted) → removed
- Deletion timestamp shown → removed (creation date shown instead)

## UNCHANGED Requirements

The following from the archived delta remain unchanged:

- Deleted Devices Section heading
- Loading state (skeleton)
- Error state (error message + retry)
- Empty state ("No deleted devices")
