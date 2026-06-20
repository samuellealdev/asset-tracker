# Tasks: Dark Theme for Web UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (shared+layout+forms, ~180L) → PR 2 (cards+tables+modal+timeline, ~180L) → PR 3 (routes, ~140L) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared + Layout + Forms (9 files) | PR 1 | Base: feat/dark-theme; standalone deliverable |
| 2 | Cards + Tables + Modal + Timeline (7 files) | PR 2 | Base: PR 1 branch; depends on shared palette |
| 3 | Route pages (7 files) | PR 3 | Base: PR 2 branch; catches inline page styles |

## Phase 1: Shared Components

- [ ] 1.1 `LoadingSkeleton.tsx`: `bg-slate-100→bg-slate-800`, skeleton bars `bg-slate-200→bg-slate-700`
- [ ] 1.2 `EmptyState.tsx`: icon bg `bg-slate-100→bg-slate-700`, title `text-slate-600→text-slate-400`, desc `text-slate-400→text-slate-500`
- [ ] 1.3 `ErrorBoundary.tsx`: icon bg `bg-red-50→bg-red-900/30`, title `text-slate-600→text-slate-300`

## Phase 2: Layout

- [ ] 2.1 `Header.tsx`: bg→`bg-slate-900`, border→`border-slate-700`, title→`text-slate-100`, btn→`text-slate-300 hover:bg-slate-700`
- [ ] 2.2 `AppLayout.tsx`: `bg-slate-50→bg-slate-900`
- [ ] 2.3 `Sidebar.tsx`: verify existing dark; overlay `bg-black/50→bg-black/60`

## Phase 3: Forms

- [ ] 3.1 `login.tsx`: page→`bg-slate-900`, card→`bg-slate-800 border-slate-700`, heading→`text-slate-100`, inputs→`bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500`, error→`bg-red-900/30 text-red-400`
- [ ] 3.2 `DeviceForm.tsx`: labels→`text-slate-300`, inputs add `bg-slate-800 text-slate-100`, border→`border-slate-600`, error→`text-red-400`, cancel→`text-slate-300 hover:bg-slate-700`
- [ ] 3.3 `EventForm.tsx`: same pattern as DeviceForm (labels, inputs, borders, cancel)

## Phase 4: Cards

- [ ] 4.1 `DeviceCard.tsx`: card→`bg-slate-800 border-slate-700`, hover→`hover:border-indigo-500`, heading→`text-slate-100`, body→`text-slate-400`, badge→`bg-indigo-900/30 text-indigo-300`, skeleton/error per design §Phase 4
- [ ] 4.2 `HealthCard.tsx`: surface same as DeviceCard, heading→`text-slate-100`, port→`text-slate-500`, status→`text-slate-300`, db-connected→`text-green-400`, disconnected→`text-red-400`
- [ ] 4.3 `MetricsCard.tsx`: surface same as DeviceCard, metric items→`bg-slate-700/50`, values→`text-slate-100`, labels→`text-slate-400`, error→`text-red-400`, warning→`text-amber-300`

## Phase 5: Tables

- [ ] 5.1 `DeviceTable.tsx`: container→`bg-slate-800 border-slate-700`, header→`bg-slate-700 text-slate-300`, rows+actions per design §Phase 5
- [ ] 5.2 `EventTable.tsx`: table patterns same as DeviceTable + EventTypeBadge: green→`bg-green-900/30 text-green-300`, blue→`bg-blue-900/30 text-blue-300`, red→`bg-red-900/30 text-red-300`

## Phase 6: Modal & Timeline

- [ ] 6.1 `DeleteDialog.tsx`: overlay→`bg-black/60`, dialog→`bg-slate-800`, icon→`bg-red-900/30`, title→`text-slate-100`, body→`text-slate-300`, per design §Phase 6
- [ ] 6.2 `EventTimeline.tsx`: line→`bg-slate-700`, dots→`bg-slate-800 ring-slate-700`, cards→`bg-slate-800 border-slate-700`, badges per EventTable, skeleton/empty per design §Phase 6

## Phase 7: Route Pages

- [ ] 7.1 `devices.tsx`: h1→`text-slate-100`
- [ ] 7.2 `events.tsx`: h1→`text-slate-100`, filter labels→`text-slate-300`, selects→`bg-slate-800 border-slate-600 text-slate-100`, form card→`bg-slate-800 border-slate-700`, cancel→`text-slate-400 hover:text-slate-200`
- [ ] 7.3 `dashboards.tsx`: h1→`text-slate-100`, h2→`text-slate-300`
- [ ] 7.4 `settings.tsx`: h1→`text-slate-100`, cards→`bg-slate-800 border-slate-700`, config rows→`bg-slate-700/50`, token code→`bg-slate-700 text-slate-300`, per design §Phase 7
- [ ] 7.5 `devices.create.tsx`: h1→`text-slate-100`, form card→`bg-slate-800 border-slate-700`, back link→`text-indigo-400 hover:text-indigo-300`, error→`text-red-400`
- [ ] 7.6 `devices.$id.tsx`: headings→`text-slate-100`, edit card→`bg-slate-800 border-slate-700`, back link→`text-indigo-400 hover:text-indigo-300`, edit btn→`text-indigo-400 hover:bg-indigo-900/30`, delete btn→`text-red-400 hover:bg-red-900/30`, skeleton/error per design §Phase 7
- [ ] 7.7 `$.tsx`: 404 text→`text-slate-600`, desc→`text-slate-400`

## Verification

- [ ] 8.1 Run `cd web-ui && npx vitest run` — all existing tests pass unchanged
- [ ] 8.2 Visual audit: each component in all states (normal, hover, focus, error, empty, loading)
- [ ] 8.3 Audit grep: `rg 'white\b|\bslate-50\b|\bslate-100\b|\bslate-200\b' web-ui/src/` — no unconverted light backgrounds remain
