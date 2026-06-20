# ux-device-grid Specification

## Purpose
Responsive CSS grid of device cards replacing the device table. Each card shows device info and inline action buttons.

## Requirements

### Requirement: Responsive Grid Layout
The system MUST render device cards in a CSS grid adapting columns to viewport width.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Desktop grid | viewport ≥ 1280px | devices load | 4 columns (grid-cols-4) |
| Laptop grid | viewport 1024-1279px | devices load | 3 columns (grid-cols-3) |
| Tablet grid | viewport 768-1023px | devices load | 2 columns (grid-cols-2) |
| Mobile grid | viewport < 768px | devices load | 1 column (grid-cols-1) |

### Requirement: Device Card Content
Each card MUST display device name, type, and creation date.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Card fields | device data loaded | card renders | name (bold), type (badge), createdAt (formatted date) |
| Long name | device name > 30 chars | card renders | name truncated with ellipsis |

### Requirement: Card Action Buttons
Each card footer MUST render Edit, Delete, and Events action buttons.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Edit action | card renders | user clicks Edit | navigates to /devices/:id/edit |
| Delete action | card renders | user clicks Delete | confirmation dialog opens, deviceId bound |
| Events action | card renders | user clicks Events | EventPopup modal opens filtered by deviceId |
| Hover state | card renders | user hovers card | action buttons become visible or more prominent |

### Requirement: Loading and Empty States
The grid MUST handle loading and empty data states gracefully.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Loading state | GET /devices pending | grid renders | skeleton cards displayed |
| Empty state | no devices exist | grid renders | "No devices found" with Add Device CTA |
| Error state | GET /devices fails | grid renders | error message with retry button |
