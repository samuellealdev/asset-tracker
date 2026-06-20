# Design: Dark Theme for Web UI

## Technical Approach

Replace all light-background Tailwind classes across 15 components + 6 route pages with a dark palette using only Tailwind 4 utility classes. No custom CSS, no hex colors, no `var()` in `className`. File-by-file class replacement — zero logic changes. Sidebar is already dark (`bg-slate-800`); Header, forms, cards, tables, and modals are light and need full conversion.

## Architecture Decisions

### Color Palette Alignment

**Choice**: Harmonize the proposal palette (slate-900 page, slate-800 surfaces) with the spec's nuance (slate-950 body from prior work, `bg-red-900/20` for errors vs `bg-red-900/30` for spec consistency).

**Rationale**: The proposal uses `bg-red-900/20` for error backgrounds, the spec uses `bg-red-900/20`. The prior work set `body bg-slate-950`. We normalize to `bg-slate-900` for the AppLayout main area per both proposal and spec, keeping the body-level `bg-slate-950` as a base layer behind the layout.

**Resolved palette** (authoritative for implementation):

| Element | Dark Value |
|---------|-----------|
| AppLayout main | `bg-slate-900` |
| Cards, tables, modals, form wrappers | `bg-slate-800` |
| Inputs (text, select, textarea) | `bg-slate-800` |
| Card/table/modal border | `border-slate-700` |
| Input border | `border-slate-600` |
| Input text | `text-slate-100` |
| Headings | `text-slate-100` |
| Body text | `text-slate-300` / `text-slate-400` |
| Labels | `text-slate-300` |
| Placeholder | `placeholder-slate-500` |
| Table header bg | `bg-slate-700` |
| Table header text | `text-slate-300` |
| Table row hover | `hover:bg-indigo-900/20` |
| Table body divider | `divide-slate-700` |
| Error text | `text-red-400` |
| Error bg | `bg-red-900/30` |
| Warning/amber text | `text-amber-300` |
| Skeleton bars | `bg-slate-700` |
| Skeleton row bg | `bg-slate-800` |
| Modal overlay | `bg-black/60` |
| Focus ring | `ring-indigo-500` (unchanged) |
| Header bg + text | `bg-slate-900` `text-slate-100` |
| Header border | `border-slate-700` |
| Logout btn | `text-slate-300 hover:bg-slate-700` |
| Cancel btn | `text-slate-300 hover:bg-slate-700` |
| Edit link | `text-indigo-400 hover:text-indigo-300` |
| Edit btn | `text-indigo-400 hover:bg-indigo-900/30` |
| Delete btn | `text-red-400 hover:bg-red-900/30` |
| Device badge (card) | `bg-indigo-900/30 text-indigo-300` |
| Device badge (table) | `bg-slate-700 text-slate-300` |
| Event green badge | `bg-green-900/30 text-green-300` |
| Event blue badge | `bg-blue-900/30 text-blue-300` |
| Event red badge | `bg-red-900/30 text-red-300` |
| Timeline line | `bg-slate-700` (was `bg-slate-200`) |
| Timeline dot ring | `ring-slate-700` (was `ring-slate-200`) |
| Timeline dot bg | `bg-slate-800` (was `bg-white`) |
| EmptyState icon bg | `bg-slate-700` (was `bg-slate-100`) |
| EmptyState title | `text-slate-400` (was `text-slate-600`) |
| EmptyState desc | `text-slate-500` (was `text-slate-400`) |
| Metrics metric item bg | `bg-slate-700/50` (was `bg-slate-50`) |
| Metrics metric value | `text-slate-100` (was `text-slate-900`) |
| Settings config row | `bg-slate-700/50` (was `bg-slate-50`) |
| Settings token code bg | `bg-slate-700 text-slate-300` |

### Tailwind-4-Only Constraint

**Choice**: No hex colors (`[#...]`), no `var()` in `className`, no inline `style` color values. All colors are Tailwind semantic utility classes.

**Rationale**: Spec requirement + Tailwind 4 skill rule. The `dark:` variant is NOT used because this is a permanent theme, not a toggle. Per spec: no `dark:` prefix — the classes ARE the dark values.

## File Changes

### Phase 1 — Foundation (shared components)
| File | Key Changes |
|------|-------------|
| `src/components/shared/LoadingSkeleton.tsx` | `bg-slate-100→bg-slate-800`, bars `bg-slate-200→bg-slate-700` |
| `src/components/shared/EmptyState.tsx` | icon bg `bg-slate-100→bg-slate-700`, title `text-slate-600→text-slate-400`, desc `text-slate-400→text-slate-500` |
| `src/components/shared/ErrorBoundary.tsx` | icon bg `bg-red-50→bg-red-900/30`, title `text-slate-600→text-slate-300` |

### Phase 2 — Layout
| File | Key Changes |
|------|-------------|
| `src/components/layout/Header.tsx` | `bg-white→bg-slate-900`, border `border-slate-200→border-slate-700`, title `text-slate-900→text-slate-100`, btn `text-slate-600 hover:bg-slate-100→text-slate-300 hover:bg-slate-700` |
| `src/components/layout/AppLayout.tsx` | `bg-slate-50→bg-slate-900` |
| `src/components/layout/Sidebar.tsx` | Already dark — verify only; overlay `bg-black/50→bg-black/60` |

### Phase 3 — Forms
| File | Key Changes |
|------|-------------|
| `src/routes/login.tsx` | Page `bg-slate-100→bg-slate-900`, card `bg-white border-slate-200→bg-slate-800 border-slate-700`, heading `text-slate-900→text-slate-100`, subtitle `text-slate-500→text-slate-400`, labels `text-slate-700→text-slate-300`, inputs `border-slate-300 text-slate-900 placeholder-slate-400→border-slate-600 text-slate-100 placeholder-slate-500`, error `bg-red-50 text-red-700→bg-red-900/30 text-red-400` |
| `src/components/devices/DeviceForm.tsx` | Labels `text-slate-700→text-slate-300`, inputs add `bg-slate-800 text-slate-100`, border `border-slate-300→border-slate-600`, error text `text-red-600→text-red-400`, cancel `text-slate-600 hover:bg-slate-100→text-slate-300 hover:bg-slate-700` |
| `src/components/events/EventForm.tsx` | Same pattern: labels→`text-slate-300`, inputs/selects/textarea add `bg-slate-800 text-slate-100`, borders→`border-slate-600`, cancel→`text-slate-300 hover:bg-slate-700` |

### Phase 4 — Cards
| File | Key Changes |
|------|-------------|
| `src/components/devices/DeviceCard.tsx` | Card `bg-white border-slate-200→bg-slate-800 border-slate-700`, hover `hover:border-indigo-200→hover:border-indigo-500`, heading `text-slate-900→text-slate-100`, body `text-slate-500→text-slate-400`, date `text-slate-400→text-slate-500`, badge `bg-indigo-50 text-indigo-700→bg-indigo-900/30 text-indigo-300`, skeleton card→`bg-slate-800 border-slate-700`, skeleton bars→`bg-slate-700`, error border→`border-slate-700` |
| `src/components/dashboards/HealthCard.tsx` | Card same surface pattern, heading `text-slate-900→text-slate-100`, port `text-slate-400→text-slate-500`, status `text-slate-600→text-slate-300`, db-connected `text-green-600→text-green-400`, db-disconnected `text-red-600→text-red-400` |
| `src/components/dashboards/MetricsCard.tsx` | Card same surface pattern, heading `text-slate-900→text-slate-100`, metric item bg `bg-slate-50→bg-slate-700/50`, value `text-slate-900→text-slate-100`, label `text-slate-500→text-slate-400`, error metric `text-red-600→text-red-400`, warning `text-amber-600→text-amber-300`, unavailable icon `bg-red-50→bg-red-900/30`, unavailable msg `text-slate-600→text-slate-400` |

### Phase 5 — Tables
| File | Key Changes |
|------|-------------|
| `src/components/devices/DeviceTable.tsx` | Container `bg-white border-slate-200→bg-slate-800 border-slate-700`, header `bg-slate-50→bg-slate-700 text-slate-500→text-slate-300`, body `divide-slate-100→divide-slate-700`, rows `bg-white/bg-slate-50/50→transparent/bg-slate-800/50`, hover `bg-indigo-50/50→bg-indigo-900/20`, name link stays `text-indigo-600` (readable on dark), date `text-slate-500→text-slate-400`, badge `bg-slate-100 text-slate-700→bg-slate-700 text-slate-300`, actions `text-slate-600 hover:bg-slate-100→text-slate-300 hover:bg-slate-700`, delete action `text-red-600 hover:bg-red-50→text-red-400 hover:bg-red-900/30`, error icon `bg-red-50→bg-red-900/30`, error title `text-slate-600→text-slate-300` |
| `src/components/events/EventTable.tsx` | Same table patterns + EventTypeBadge: `bg-green-100 text-green-700→bg-green-900/30 text-green-300`, blue→`bg-blue-900/30 text-blue-300`, red→`bg-red-900/30 text-red-300`, gray→`bg-slate-700 text-slate-300` |

### Phase 6 — Modal & Timeline
| File | Key Changes |
|------|-------------|
| `src/components/devices/DeleteDialog.tsx` | Overlay `bg-black/50→bg-black/60`, dialog `bg-white→bg-slate-800`, icon bg `bg-red-100→bg-red-900/30`, title `text-slate-900→text-slate-100`, body `text-slate-600→text-slate-300`, deviceName `text-slate-900→text-slate-100`, cancel `text-slate-600 hover:bg-slate-100→text-slate-300 hover:bg-slate-700` |
| `src/components/events/EventTimeline.tsx` | Timeline line `bg-slate-200→bg-slate-700`, dot ring `ring-slate-200→ring-slate-700`, dot bg `bg-white→bg-slate-800`, card `bg-white border-slate-200→bg-slate-800 border-slate-700`, title `text-slate-900→text-slate-100`, desc `text-slate-500→text-slate-400`, actor `text-slate-400→text-slate-500`, date `text-slate-400→text-slate-500`, badges same as EventTable, empty state icon `bg-slate-100→bg-slate-700`, skeleton row `bg-slate-200→bg-slate-700`, skeleton card `bg-white border-slate-200→bg-slate-800 border-slate-700` |

### Phase 7 — Route pages (inline light styles)
| File | Key Changes |
|------|-------------|
| `src/routes/devices.tsx` | h1 `text-slate-900→text-slate-100` |
| `src/routes/events.tsx` | h1 `text-slate-900→text-slate-100`, filter label `text-slate-700→text-slate-300`, filter select `bg-white border-slate-300 text-slate-700→bg-slate-800 border-slate-600 text-slate-100`, form card `bg-white border-slate-200→bg-slate-800 border-slate-700`, form title `text-slate-900→text-slate-100`, cancel `text-slate-500 hover:text-slate-700→text-slate-400 hover:text-slate-200`, no-device msg `text-slate-500→text-slate-400`, error `text-red-600→text-red-400` |
| `src/routes/dashboards.tsx` | h1 `text-slate-900→text-slate-100`, section h2 `text-slate-700→text-slate-300` |
| `src/routes/settings.tsx` | h1 `text-slate-900→text-slate-100`, cards `bg-white border-slate-200→bg-slate-800 border-slate-700`, card titles `text-slate-900→text-slate-100`, config rows `bg-slate-50→bg-slate-700/50 label text-slate-700→text-slate-300 value text-slate-500→text-slate-400`, auth card title `text-slate-900→text-slate-100`, status badge `bg-green-100 text-green-700→bg-green-900/30 text-green-300`, token code `bg-slate-100 text-slate-600→bg-slate-700 text-slate-300`, unauthenticated icon `bg-slate-100→bg-slate-700`, unauthenticated text `text-slate-500→text-slate-400` |
| `src/routes/devices.create.tsx` | h1 `text-slate-900→text-slate-100`, form card `bg-white border-slate-200→bg-slate-800 border-slate-700`, back link `text-indigo-600 hover:text-indigo-800→text-indigo-400 hover:text-indigo-300`, error `text-red-600→text-red-400` |
| `src/routes/devices.$id.tsx` | All headings `text-slate-900→text-slate-100`, edit card `bg-white border-slate-200→bg-slate-800 border-slate-700`, back link `text-indigo-600 hover:text-indigo-800→text-indigo-400 hover:text-indigo-300`, edit btn `text-indigo-600 hover:bg-indigo-50→text-indigo-400 hover:bg-indigo-900/30`, delete btn `text-red-600 hover:bg-red-50→text-red-400 hover:bg-red-900/30`, error icon `bg-red-50→bg-red-900/30`, error title `text-slate-600→text-slate-300`, skeleton `bg-slate-200→bg-slate-700`, skeleton card `bg-slate-100→bg-slate-800` |
| `src/routes/$.tsx` | 404 text `text-slate-300→text-slate-600`, desc `text-slate-600→text-slate-400` |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (vitest) | All 15 components + route pages | Existing tests pass without changes — test role/text assertions, not visual classes. Run `npx vitest run` to verify. |
| Visual | Each component in all states | Playwright screenshots (optional, can be added post-implementation). Manual browser review per component. |
| WCAG AA | Text contrast on all states | Manual verification: headings ≥3:1, body ≥4.5:1 using Tailwind's built-in slate scale. |

## Implementation Order

1. **Shared** (LoadingSkeleton, EmptyState, ErrorBoundary) — no dependencies
2. **Layout** (Header, AppLayout, Sidebar overlay) — Header consumed by all pages
3. **Forms** (Login, DeviceForm, EventForm) — consumed by route pages
4. **Cards** (DeviceCard, HealthCard, MetricsCard) — consumed by dashboards/device detail
5. **Tables** (DeviceTable, EventTable) — consumed by device/event list pages
6. **Modal + Timeline** (DeleteDialog, EventTimeline) — consumed by device detail
7. **Routes** (devices, events, dashboards, settings, create, $id, 404) — update after all components to catch inline styles

Each phase is independently testable: run `npx vitest run` and visually verify in browser.

## Risks

- **Missed inline styles in route pages**: The route pages (devices.tsx, events.tsx, etc.) have their own light background wrappers and heading colors. Systematic grep for `white`, `slate-50`, `slate-100`, `slate-200` across all files catches these.
- **Contrast on indigo-600 links**: `text-indigo-600` on `bg-slate-800` is readable (≈4.6:1) — no change needed per spec.
- **MetricsCard warning threshold**: `text-amber-300` on dark bg meets contrast; `text-red-400` on dark for >50 errors is per spec.
- **No new dependencies**: Pure class swap — rollback is `git revert`.
