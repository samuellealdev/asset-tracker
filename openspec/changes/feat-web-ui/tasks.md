# Tasks: Web UI Frontend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3200–3800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 7 PRs: CORS→Scaffold→Foundation→Auth+Layout→Devices→Events+Dash→Polish+Tests+Docker |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Lines | Base |
|------|------|----|-------|------|
| 1 | CORS middleware (Go) | PR 1 | ~80 | feat/web-ui |
| 2 | Project scaffolding | PR 2 | ~300 | PR 1 |
| 3 | API client + schemas + utils | PR 3 | ~500 | PR 2 |
| 4 | Auth + Layout | PR 4 | ~550 | PR 3 |
| 5 | Devices CRUD | PR 5 | ~600 | PR 4 |
| 6 | Events + Dashboards + Settings | PR 6 | ~550 | PR 5 |
| 7 | Polish + E2E + Docker/K8s | PR 7 | ~550 | PR 6 |

## Phase 0: CORS Prerequisite (PR 1)

- [ ] 0.1 Add `CORSMiddleware` to `go-service/internal/interfaces/middleware.go`: set `Access-Control-Allow-Origin: *`, `Allow-Headers: Authorization, Content-Type`, `Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`; handle OPTIONS preflight with 204. Write test in `middleware_test.go` (TDD: preflight→implement). Design: §Production prerequisite, API audit.
- [ ] 0.2 Wire CORS as outermost in `go-service/cmd/main.go`: `CORSMiddleware(LoggingMiddleware(mux))`. Verify `go test ./...` passes.

## Phase 1: Project Scaffolding (PR 2)

- [ ] 1.1 Create `web-ui/package.json` — React 19, TS strict, Vite, TanStack Router/Query, Tailwind 4, shadcn/ui, Zod, Vitest, Playwright.
- [ ] 1.2 Create `vite.config.ts` — React plugin, dev proxy (`/api/go`→:8080, `/api/node`→:3000), Vitest config. Design: §Dev proxy.
- [ ] 1.3 Create `tsconfig.json` (strict, `@/`→`src/`), `.eslintrc.cjs`, `tailwind.config.ts`. Design: §Architecture Decisions.
- [ ] 1.4 Create `index.html` + `web-ui/src/main.tsx` entry point.

## Phase 2: Foundation (PR 3)

- [ ] 2.1 Create `lib/api/client.ts` — `fetch` wrapper with Bearer interceptor, 401→logout. Test with Vitest+MSW (TDD: test interceptor→implement). Design: §Data Flow.
- [ ] 2.2 Create Zod schemas: `lib/schemas/auth.ts`, `device.ts`, `event.ts`. Test valid/invalid payloads (TDD). Design: §Validation. Specs: web-devices Req: Device Create validation.
- [ ] 2.3 Create API fns: `lib/api/{auth,devices,events,health,metrics}.ts`. Test with MSW (TDD). Design: §Directory Structure.
- [ ] 2.4 Create `lib/utils/cn.ts` (`clsx`+`twMerge`). Unit test. Design: §Styling.
- [ ] 2.5 Create `App.tsx` — QueryClientProvider + AuthProvider + RouterProvider. Design: §Architecture.

## Phase 3: Auth + Layout (PR 4)

- [x] 3.1 Enhance `context/AuthContext.tsx` — `{ token, isAuthenticated, isLoading, login(username, password), logout }`. API call, loading state, error handling, localStorage persistence. Test (TDD). Spec: web-auth Req: AuthContext.
- [x] 3.2 Create `hooks/use-auth.ts` — `useLogin` (TanStack Query mutation), `useLogout`. Test with mocked client (TDD). Spec: web-auth Req: Login (success/failure/expired).
- [x] 3.3 Create `routes/login.tsx` — username/password form, error display, redirect to `/devices`, loading spinner. Spec: web-auth all scenarios.
- [x] 3.4 Create `routes/__root.tsx` — `beforeLoad` auth guard, redirect to `/login`, AppLayout wrapper. Spec: web-auth Req: Protected Routes.
- [x] 3.5 Create layout components: `Sidebar.tsx` (nav links + active highlight), `Header.tsx` (title + logout), `AppLayout.tsx` (responsive: desktop sidebar, tablet hamburger). Spec: web-layout all requirements.
- [x] 3.6 Create `routes/index.tsx` (→`/devices`) + `routes/$.tsx` (404). Spec: web-layout Req: Routing.

## Phase 4: Devices CRUD (PR 5)

- [ ] 4.1 Create `hooks/use-devices.ts` — query hooks + CRUD mutations with invalidation. Test (TDD). Design: §Query Hooks.
- [ ] 4.2 Create `components/devices/DeviceTable.tsx` — list with loading/empty/error states. Spec: web-devices Req: Device List (loaded/empty/error).
- [ ] 4.3 Create `components/devices/DeviceCard.tsx` + `components/devices/DeviceForm.tsx` (Zod-validated). Spec: web-devices Req: Device Detail + Create + Edit.
- [ ] 4.4 Create routes: `routes/devices.tsx`, `devices.$id.tsx`, `devices.create.tsx`. Delete with confirmation dialog. Spec: web-devices Req: Device Delete.

## Phase 5: Events + Dashboards + Settings (PR 6)

- [ ] 5.1 Create `hooks/use-events.ts` — `useEvents(deviceId?)`, `useCreateEvent`. Test (TDD). Spec: web-events Req: Event List + Filter.
- [ ] 5.2 Create `components/events/EventTable.tsx` + `EventForm.tsx` (device dropdown from `useDevices`). Spec: web-events all requirements.
- [ ] 5.3 Create `hooks/use-health.ts` + `hooks/use-metrics.ts` — 30s auto-refresh. Test (TDD). Spec: web-dashboards both requirements.
- [ ] 5.4 Create `components/dashboards/HealthCard.tsx` (green/red) + `MetricsCard.tsx` + `routes/dashboards.tsx`. Spec: web-dashboards all scenarios.
- [ ] 5.5 Create `routes/events.tsx` + `routes/settings.tsx` (read-only config). Design: §Route Map.

## Phase 6: Polish + E2E + Docker/K8s (PR 7)

- [ ] 6.1 Create `components/shared/ErrorBoundary.tsx`, `LoadingSkeleton.tsx`, `EmptyState.tsx`. Spec: web-layout Req: Error Boundary.
- [ ] 6.2 Write Playwright E2E smoke tests: login→devices CRUD→events→dashboards. Proposal: §Success Criteria (verify 5 capabilities).
- [ ] 6.3 Add web-ui to `docker-compose.yml` — multi-stage build, healthcheck. Design: §File Changes.
- [ ] 6.4 Create `k8s/web-deployment.yaml` + `k8s/web-service.yaml`. Modify `k8s/ingress.yaml` if exists.
