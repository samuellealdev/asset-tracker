# Tasks: Move Deleted Devices to Devices Page

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation

- [x] 1.1 Create `web-ui/src/components/devices/DeletedDeviceCard.tsx` with deleted styling, type badge, deletion date, Details button
- [x] 1.2 Create `web-ui/src/components/devices/__tests__/DeletedDeviceCard.test.tsx`

## Phase 2: Core Implementation

- [x] 2.1 Refactor `DeletedDevicesList.tsx` to render a responsive grid of DeletedDeviceCards
- [x] 2.2 Update `DeletedDevicesList.test.tsx` for card-based rendering

## Phase 3: Integration / Wiring

- [x] 3.1 Remove DeletedDevicesList from `dashboards.tsx`
- [x] 3.2 Add DeletedDevicesList to `devices.tsx` below DeviceGrid
- [x] 3.3 Update `dashboards.test.tsx` — remove mock for DeletedDevicesList
- [x] 3.4 Update `devices.test.tsx` — add mock for DeletedDevicesList

## Phase 4: Testing

- [x] 4.1 Run all tests and verify they pass
