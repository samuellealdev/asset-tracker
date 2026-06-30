# Proposal: Deleted Devices Visual Redesign

## Intent

The Deleted Devices section uses `bg-slate-800 border-slate-700` — identical to the active device grid. Users cannot visually distinguish archived from active devices without reading labels. The "Deleted" badge reuses the indigo palette meant for device type badges. This redesign introduces a distinct "Red Ledger" aesthetic: subtle red accents, a red badge, and a creative cross-hatch watermark that makes the section immediately recognizable as an archive.

## Scope

### In Scope
- Redesign `DeletedDevicesList` section wrapper with left red border accent and subtle gradient
- Add `deleted` prop to `DeviceGridCard` — red badge with Trash2 icon, muted opacity, diagonal watermark
- Update `LoadingSkeleton` grid variant applied inside the section with matching background tint
- Preserve all existing behavior: toggle, animation, skeleton grid, pulse dot, modal

### Out of Scope
- Backend/API changes
- Changes to active devices section styling
- New components or routes
- Changing device card structure or data model

## Capabilities

> Research: `openspec/specs/web-devices/` § Deleted Devices Section (Toggle) — Scenario "Toggle shows deleted devices" (line 116) states "same styling as active cards." This proposal changes that contract.

### New Capabilities
None

### Modified Capabilities
- `web-devices`: Update "Toggle shows deleted devices" scenario — deleted cards MUST render with distinct red-accent styling. Update "Refresh loading" scenario — skeleton inside deleted section uses matching tint.

## Approach

**Design direction: "Red Ledger"** — fuses Option A (tombstone) and Option C (red accent panel) with a creative watermark.

1. **Section wrapper** (`DeletedDevicesList.tsx`): Add `border-l-2 border-l-rose-600/40` left accent, `bg-gradient-to-br from-red-950/15 via-transparent to-transparent` gradient, softened border to `border-rose-700/20`.
2. **Device cards** (`DeviceGridCard.tsx`): New optional `deleted: boolean` prop. When `true`: muted opacity `opacity-90`, card background `bg-slate-800/80`, thin red left-accent inset `border-l border-l-red-700/30`. A CSS `background-image` overlay with a faint repeating diagonal gradient pattern (≈1% opacity) creates a "voided document" watermark effect.
3. **Red badge**: Replace indigo badge with `bg-red-950/40 text-red-400 ring-1 ring-red-700/30`. Add `<Trash2 className="h-3 w-3" />` icon before "Deleted" text.
4. **Date label**: "Created:" → "Deleted:" with `text-red-400/60`.
5. **Skeleton**: Pass `className` override to `LoadingSkeleton` grid variant for matching background tint. No new variant needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web-ui/src/components/devices/DeletedDevicesList.tsx` | Modified | Red-accent wrapper, gradient, pass `deleted` prop |
| `web-ui/src/components/devices/DeviceGridCard.tsx` | Modified | Optional `deleted` prop; red badge, watermark, muted style |
| `web-ui/src/components/devices/__tests__/DeletedDevicesList.test.tsx` | Modified | Assert red accent classes present |
| `web-ui/src/components/devices/__tests__/DeviceGridCard.test.tsx` | Modified | Assert red styling when `deleted=true` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cross-hatch CSS incompatible with Tailwind 4 | Low | Use `[background-image:repeating-linear-gradient(...)]` arbitrary value; fallback to solid tint |
| Red styling too aggressive on dark bg | Low | Use low-opacity reds (10–25%); preview both |
| Watermark distracts from card readability | Low | Keep pattern at ≤1% opacity; remove if distracting |

## Rollback Plan

Revert all four files: remove `deleted` prop from `DeviceGridCard`, restore `border-slate-700 bg-slate-800` wrapper classes, restore indigo badge. Zero DB/API impact.

## Dependencies

None — pure CSS/visual change.

## Success Criteria

- [ ] Section wrapper has visible red left-border accent and gradient distinct from active section
- [ ] "Deleted" badge uses red palette (`bg-red-950/40 text-red-400`) with Trash2 icon
- [ ] Deleted cards have muted opacity and visible (but subtle) diagonal watermark
- [ ] Toggle, skeleton grid loading, pulse dot, and modal functionality unchanged
- [ ] Tests pass (`node --test`), TypeScript clean, Vite build succeeds

---

## Proposal Question Round

**Design direction validation** — one question:

1. The "Red Ledger" design uses a faint diagonal cross-hatch watermark on deleted cards to evoke a "voided archive document." Is this watermark direction compelling, or would a simpler red left-border accent on each card (no watermark) be preferred? The watermark is the "surprise" element — it's barely visible but distinctive on close inspection.
