# Design: Toggle Deleted Devices

## Technical Approach

Three changes:

1. **DeviceGridCard**: Make `onDelete` and `onEdit` props optional. Conditionally render the Edit/Delete buttons only when their handlers are provided. This allows the same card to serve both active and deleted devices.

2. **DeletedDevicesList**: Accept `showDeleted` and `onToggle` props. Internally map events to the shape expected by `DeviceGridCard` — transform `Event` data into a `Device` shape (use `deviceId` as `id`, `name` from event, omit `type` since events don't carry it, use current date as `createdAt`). Wrap in the same responsive grid.

3. **devices.tsx**: Add `showDeleted` state (default `false`). Replace the always-visible `<DeletedDevicesList />` with a toggle button + conditionally rendered section. Wrap the section in a `div` with `overflow-hidden` and `transition-all duration-300` for the slide animation. Use `max-h-0` / `max-h-[5000px]` for the slide effect.

## Architecture Decisions

### Decision: Conditional button rendering vs separate component

**Choice**: Make `onDelete`/`onEdit` optional in `DeviceGridCard`; conditionally render buttons.
**Alternatives considered**: New prop like `mode: "active" | "deleted"` (adds coupling); separate component (code duplication).
**Rationale**: The card layout is identical. Only the action buttons differ. Optional handlers with conditional JSX is the simplest approach — no new coupling, no duplication, backward-compatible.

### Decision: Convert Event → Device shape at the list level

**Choice**: `DeletedDevicesList` maps each event into a pseudo-Device object before passing to `DeviceGridCard`.
**Alternatives considered**: Changing `DeviceGridCard` to accept either Device or Event (adds complexity); changing the API (out of scope).
**Rationale**: The event schema has `deviceId`, `name`, and `timestamp`. DeviceGridCard expects `Device { id, name, type, createdAt }`. Mapping at the list level isolates the conversion in one place.

### Decision: Slide animation via max-height

**Choice**: Use `max-h-0` / `max-h-[5000px]` with `overflow-hidden transition-all duration-300` on the section wrapper.
**Alternatives considered**: `scale-y` transform (distorts content); grid-row (works but less standard).
**Rationale**: Tailwind supports max-height transitions. 5000px is an arbitrary large value that accommodates any realistic number of cards. Simpler than JS-driven animation libraries with no extra dependencies.

## Data Flow

```
devices.tsx
├── useDevices() → DeviceGrid (active devices)
├── useState(false) → showDeleted
├── useDeletedDevices() → events[] → DeletedDevicesList
│   └── events.map(e => DeviceGridCard)
│       └── DeviceGridCard(device={mapped}, onDelete=undefined, onEdit=undefined)
└── Toggle button → setShowDeleted(!showDeleted)
```

Event → Device mapping:
```typescript
{
  id: event.deviceId,
  name: event.name,
  type: "Unknown", // events don't carry device type
  createdAt: event.timestamp, // use deletion timestamp as creation date
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `DeviceGridCard.tsx` | Modify | Optional onDelete/onEdit, conditional buttons |
| `DeletedDevicesList.tsx` | Refactor | Accept toggle props, use DeviceGridCard |
| `devices.tsx` | Modify | showDeleted state, toggle button, animation wrapper |
| `DeletedDeviceCard.tsx` | Delete | No longer needed |
| `DeviceGridCard.test.tsx` | Modify | Tests for optional actions mode |
| `DeletedDevicesList.test.tsx` | Modify | Tests for toggle behavior and DeviceGridCard usage |
| `DeletedDeviceCard.test.tsx` | Delete | No longer needed |
| `devices.test.tsx` | Modify | Update mock for refactored DeletedDevicesList |

## Interfaces / Contracts

```typescript
// DeviceGridCard — optional handlers = no action buttons
interface DeviceGridCardProps {
  device: Device;
  onDelete?: (id: string) => void;
  onEdit?: (deviceId: string) => void;
}

// DeletedDevicesList — toggle control
interface DeletedDevicesListProps {
  showDeleted: boolean;
  onToggle: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | DeviceGridCard renders only Details when no handlers | Pass undefined onDelete/onEdit, assert button presence/absence |
| Unit | DeviceGridCard backward-compatible with handlers | Same as existing tests |
| Unit | DeletedDevicesList toggle behavior | Renders button with count, calls onToggle |
| Unit | DeletedDevicesList uses DeviceGridCard | Assert DeviceGridCard renders per event |
| Route | devices.tsx toggle flow | Show/hide section, button text changes |
| Coverage | DeletedDeviceCard removal | No imports, no tests referencing it |

## Migration / Rollout

No data migration needed. The events API returns the same shape. Existing users see no deleted devices section by default — they must toggle to see it.

## Open Questions

None.
