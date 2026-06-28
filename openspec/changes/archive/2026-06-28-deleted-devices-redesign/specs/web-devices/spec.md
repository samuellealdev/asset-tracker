# Delta for web-devices

## MODIFIED Requirements

### Requirement: Deleted Devices Section (Toggle)

The system MUST display a "Deleted Devices" section below the active device grid on the Devices page, showing devices that were previously hard-deleted (event type `device.deleted`). The section MUST be visually distinct from the active device grid using a "Red Ledger" aesthetic: red left-border accent (`border-l-2 border-l-rose-600/40`) and subtle red-tinted gradient background. Each deleted device card MUST render with muted opacity, a thin red left accent, a red "Deleted" badge with Trash2 icon, and display "Deleted:" as the date label (replacing "Created:"). The section MUST be hidden by default with a toggle button to show/hide it. During data refresh, the system MUST replace device cards with skeleton placeholders matching the responsive grid layout and red-tinted background, and MUST keep the toggle button visible with the stale device count.
(Previously: deleted devices rendered as standard DeviceGridCards with identical styling to active cards — no visual distinction.)

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
(Previously: each deleted device renders as a standard DeviceGridCard — same styling as active cards.)

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
(Previously: skeleton cards had no red-tinted background.)

#### Scenario: Error state

- GIVEN the deleted devices query fails
- THEN an error message with a retry button is displayed

#### Scenario: Details navigates to device detail

- GIVEN a deleted device card is rendered
- WHEN user clicks "Details"
- THEN user navigates to /devices/$id
