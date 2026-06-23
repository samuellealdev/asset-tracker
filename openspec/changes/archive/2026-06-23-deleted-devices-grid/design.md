# Design: Move Deleted Devices to Devices Page

## Technical Approach

Create a `DeletedDeviceCard` component following the `DeviceGridCard` pattern with deleted-specific visuals. Refactor `DeletedDevicesList` to use `DeletedDeviceCard` in a grid layout. Remove it from `dashboards.tsx` and add it to `devices.tsx` below the active `DeviceGrid`. No backend changes needed.

## Architecture Decisions

### Decision: Card variant vs separate component

**Choice**: Create a standalone `DeletedDeviceCard` component.
**Alternatives considered**: Adding props to `DeviceGridCard` (adds complexity); inlining cards in `DeletedDevicesList` (no reuse).
**Rationale**: The deleted card has different props (no onDelete/onEdit) and completely different visual style. A separate component avoids conditional logic and keeps each card focused.

### Decision: Grid layout for deleted devices

**Choice**: Same responsive grid as `DeviceGrid` (1-4 columns) for consistency.
**Alternatives considered**: Single column list (current design); two-column grid.
**Rationale**: The existing DeviceGridCard uses a 1-4 column responsive grid. Matching this keeps the Devices page visually coherent.

### Decision: Muted opacity approach

**Choice**: Apply `opacity-70` + muted border/background to distinguish deleted cards.
**Rationale**: Tailwind classes `opacity-70`, `border-red-900/20`, `bg-slate-800/50` create clear visual distinction without custom CSS.

## Data Flow

```
devices.tsx
├── useDevices() → DeviceGrid (active devices) ← no change
└── useDeletedDevices() → DeletedDevicesList → DeletedDeviceCard[]
    └── GET /api/node/events?type=device.deleted ← existing API
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/routes/dashboards.tsx` | Modify | Remove DeletedDevicesList import and usage |
| `web-ui/src/routes/devices.tsx` | Modify | Import and render DeletedDevicesList below DeviceGrid |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modify | Refactor to render cards grid instead of list rows |
| `web-ui/src/components/devices/DeletedDeviceCard.tsx` | Create | Card component with deleted styling, Details button only |
| `web-ui/src/routes/__tests__/dashboards.test.tsx` | Modify | Remove mock for DeletedDevicesList |
| `web-ui/src/routes/__tests__/devices.test.tsx` | Modify | Mock DeletedDevicesList |
| `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx` | Modify | Update to test card rendering |
| `web-ui/src/components/devices/__tests__/DeletedDeviceCard.test.tsx` | Create | Tests for the new card component |

## Interfaces / Contracts

```typescript
// DeletedDeviceCard — no onDelete/onEdit, reads from Event schema
interface DeletedDeviceCardProps {
  name: string;
  deviceId: string;
  type: string;
  timestamp: string; // deletion time
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | DeletedDeviceCard renders name, type badge, deletion date, Details button | Render and assert text/buttons present |
| Unit | DeletedDeviceCard has opacity-70 and "Deleted" badge | Check class name and badge text |
| Unit | DeletedDeviceCard navigates on Details click | Mock useNavigate, assert path |
| Unit | DeletedDevicesList renders cards in grid | Mock useDeletedDevices, assert grid structure |
| Route | devices.tsx shows deleted devices section | Mock DeletedDevicesList, assert presence |
| Route | dashboards.tsx no longer renders DeletedDevicesList | Mock removed, assert absence |

## Migration / Rollout

No migration required. Both the old (dashboard) and new (devices) location render the same API data. The dashboard import is simply removed and re-added on the devices page.

## Open Questions

None.
