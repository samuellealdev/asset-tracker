# Delta for web-devices

## MODIFIED Requirements

### Requirement: Deleted Devices Section (Toggle)

The system MUST display a "Deleted Devices" section below the active device grid on the Devices page, showing devices that were previously hard-deleted (event type `device.deleted`). The section MUST be hidden by default with a toggle button to show/hide it. During data refresh (re-fetch while data already exists), the system MUST replace device cards with skeleton placeholders in the same responsive grid layout and MUST keep the toggle button visible with the stale device count.

(Previously: Loading state only covered initial query load; no refresh-specific skeleton behavior defined)

#### Scenario: Section hidden by default

- GIVEN deleted device events exist
- WHEN user navigates to /devices
- THEN a "Deleted Devices" heading is NOT visible
- AND a toggle button is displayed: "Show deleted devices (N)" where N is the count

#### Scenario: Toggle shows deleted devices

- GIVEN the toggle button is visible
- WHEN user clicks the toggle
- THEN the deleted devices section slides in with animation
- AND each deleted device renders as a standard `DeviceGridCard` (same styling as active cards)
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
- THEN a loading skeleton is displayed in the deleted devices section

#### Scenario: Refresh loading

- GIVEN deleted devices data already exists and is displayed
- WHEN the query re-fetches (data is being refreshed)
- THEN skeleton cards matching the responsive grid layout replace the device cards in the grid area
- AND the toggle button remains visible showing the stale device count
- AND no spinner or loading indicator appears inside the toggle button

#### Scenario: Error state

- GIVEN the deleted devices query fails
- THEN an error message with a retry button is displayed

#### Scenario: Details navigates to device detail

- GIVEN a deleted device card is rendered
- WHEN user clicks "Details"
- THEN user navigates to /devices/$id
