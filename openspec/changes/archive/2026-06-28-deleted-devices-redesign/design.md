# Design: Deleted Devices Visual Redesign

## Technical Approach

Pure CSS/Tailwind change across 3 components. No structural, data, or API changes. A new optional `deleted: boolean` prop on `DeviceGridCard` conditionally applies the simplified "Red Ledger" aesthetic (no watermark). Section wrapper and skeletons use Tailwind classes for red accents. All existing behavior — toggle animation, modal, pulse dot — preserved unchanged.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `deleted: boolean` prop on DeviceGridCard | Conditional logic in shared card component | **Chosen**: Single source of truth. `false` (default) renders identically to current — zero visual change for active devices |
| Separate `DeletedDeviceCard` component | Isolates deleted logic, simplifies conditionals | Rejected: ~80% markup duplication, risk of diverging from active cards |
| `[&>div]` arbitrary variants for skeleton tint | Requires Tailwind 4 syntax | **Chosen**: Already on Tailwind 4 (vite plugin). `LoadingSkeleton` already supports `className` — no new variant needed |
| Explicit `cardClassName` prop on LoadingSkeleton | More precise targeting | Rejected: Adds API surface for a single use case; `[&>div]` is sufficient |

## Data Flow

No data flow changes. Existing flow preserved:

```
useDeletedDevices() → events[] → mapEventToDevice() → Device (type="Deleted", createdAt=timestamp)
                                                         ↓
                                            DeviceGridCard (deleted=true)
                                                         ↓
                                              Red badge, muted card, "Deleted:" label
```

Branching logic on `DeviceGridCard`:

```
deleted === true?
├─ badge  → <Trash2/> + "Deleted" (bg-red-950/40 text-red-400)
├─ label  → "Deleted:" text-red-400/60
├─ card   → opacity-70 bg-slate-800/80 border-l-red-700/30
├─ buttons→ Only Details (suppress Edit/Delete even if handlers passed)
└─ else   → Existing indigo badge, "Created:", full styling, all buttons
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web-ui/src/components/devices/DeviceGridCard.tsx` | Modify | Add `deleted?: boolean`. When true: apply `opacity-70 bg-slate-800/80 border-l-red-700/30`, render `<Trash2/>` + "Deleted" badge (`bg-red-950/40 text-red-400 ring-1 ring-red-700/30`), label → "Deleted:" (`text-red-400/60`), suppress Edit/Delete button rendering |
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modify | Section wrapper: replace `border-slate-700 bg-slate-800` with `border-rose-700/20 bg-gradient-to-br from-red-950/15 via-transparent to-transparent border-l-2 border-l-rose-600/40`. Pass `deleted={true}` to DeviceGridCard. Pass `className="[&>div]:bg-red-950/10 [&>div]:border-red-900/20 [&>div]:opacity-60"` to LoadingSkeleton grid variant |
| `web-ui/src/components/shared/LoadingSkeleton.tsx` | No change | Already accepts `className` prop via `cn()` |
| `web-ui/src/components/devices/__tests__/DeviceGridCard.test.tsx` | Modify | Add: red badge with Trash2 icon when `deleted=true`, "Deleted:" label, muted opacity/border classes, only Details button, suppress Edit/Delete |
| `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx` | Modify | Assert: section has `border-l-rose-600/40` and `from-red-950/15` classes, skeleton grid gets red-tinted className, cards render red badge not indigo |

## Tailwind Class Reference

### Section wrapper (DeletedDevicesList.tsx line 127)

```
border-rose-700/20 bg-gradient-to-br from-red-950/15 via-transparent to-transparent
border-l-2 border-l-rose-600/40 p-6 rounded-lg shadow-sm
```
Replaces: `border-slate-700 bg-slate-800`

### Deleted card overlay (DeviceGridCard.tsx — additive when `deleted=true`)

```
opacity-70 bg-slate-800/80 border-l-red-700/30
```
`border-l-red-700/30` overrides the existing `border border-slate-700` left border color.

### Red badge (replaces indigo type badge)

```
bg-red-950/40 text-red-400 ring-1 ring-red-700/30
```
With `<Trash2 className="h-3 w-3" />` icon preceding "Deleted" text.

### Date label

```
"Deleted:" text-red-400/60
```
Replaces: `"Created:" text-slate-500`

### Skeleton tint (passed as className to LoadingSkeleton)

```
[&>div]:bg-red-950/10 [&>div]:border-red-900/20 [&>div]:opacity-60
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (DeviceGridCard) | `deleted=true`: red badge with Trash2, "Deleted:" label, `opacity-70`, `border-l-red-700/30`, only Details button, Edit/Delete suppressed | `vitest` + `@testing-library/react` — assert className strings and DOM queries |
| Unit (DeviceGridCard) | `deleted=false` (default): renders unchanged — indigo badge, "Created:", all buttons | Existing tests pass unmodified |
| Unit (DeletedDevicesList) | Section wrapper has `border-l-rose-600/40` and `from-red-950/15` gradient classes | `vitest` — `expect(section.className).toContain(...)` |
| Unit (DeletedDevicesList) | Skeleton grid receives `[&>div]:bg-red-950/10` className override | `vitest` — assert className on grid container |
| Integration | Toggle → deleted cards render with full red styling, skeleton tint matches | Extend existing toggle/refresh tests with red-class assertions |

## Rollback

Revert all modified files. Remove `deleted` prop from `DeviceGridCard`, restore `border-slate-700 bg-slate-800` to section wrapper. Zero DB/API impact.

## Open Questions

None — all design decisions are resolved.
