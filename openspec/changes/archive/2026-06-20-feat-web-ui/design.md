# Design: Web UI Frontend

**Status**: success

**Executive Summary**: React 19 SPA with Vite + TanStack Router (type-safe, file-based) + TanStack Query v5 (server cache) + React Context (auth) + Tailwind CSS 4 + shadcn/ui. Zod validation, Vitest + Playwright. Container/Presentational components with SOLID DIP. 8 routes covering login, devices CRUD, events, dashboards (health + metrics for both services), and settings. CORS must be added to Go service as prerequisite.

**Artifacts**: `openspec/changes/feat-web-ui/design.md`, Engram `sdd/feat-web-ui/design`

**Next Recommended**: sdd-tasks

**Risks**: Go service lacks CORS middleware (blocker — must add `Access-Control-Allow-Origin`, `Allow-Headers: Authorization, Content-Type`, `Allow-Methods: GET,POST,PUT,DELETE,OPTIONS` before UI can function); Node.js events unauthenticated (data exposure risk); no pagination on lists (accepted limitation); metrics endpoints return JSON counters, not standard Prometheus text format

**Skill Resolution**: paths-injected

---

## Approach

SPA consuming two backend services (Go :8080, Node :3000). API client is a thin `fetch` wrapper with Bearer interceptor + 401→logout. TanStack Query caches server state with query-key invalidation on mutations. React Context holds auth token — no global state library needed (single token value). Components follow Container/Presentational: containers call hooks, presentationals receive props (SRP). DIP applied via dependency direction inward: components→hooks→client→`fetch`, never reverse.

## Backend API Audit (from codebase)

| Service | Route | Method | Auth | Response shape |
|---|---|---|---|---|
| Go :8080 | `/auth/login` | POST | — | `{"token":"..."}` |
| Go | `/devices` | GET/POST | JWT | `[{id,name,type,createdAt}]` / 201 |
| Go | `/devices/{id}` | GET/PUT/DELETE | JWT | `{id,name,type,createdAt}` / 204 |
| Go | `/health/live` | GET | — | `{"status":"ok"}` |
| Go | `/health/ready` | GET | — | 200 or 503 |
| Go | `/metrics` | GET | — | JSON counters (`requests_total`, `errors_total`) |
| Node :3000 | `/events` | GET | — | `[{id,type,deviceId,name,timestamp,actor,description}]` |
| Node | `/events` | POST | — | Event object (201) |
| Node | `/health/*`, `/metrics` | GET | — | Same shape as Go |

**CORS**: Go has NONE. Node sets `Access-Control-Allow-Origin: *` with GET/POST/OPTIONS. Go CORS middleware is a prerequisite task.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Router | TanStack Router v1 | Type-safe params + search params, generated route tree, file-based conventions |
| Server state | TanStack Query v5 | Cache invalidation on mutations, stale-while-revalidate, devtools, no boilerplate reducers |
| Auth state | React Context | Single token value — no need for Zustand/Redux overhead |
| Component pattern | Container/Presentational | SRP: containers fetch via hooks, presentationals receive props only |
| HTTP client | `fetch` wrapper (zero deps) | Interceptor injects Bearer, catches 401→logout, base URL configurable |
| CSS | Tailwind CSS 4 + shadcn/ui | Utility consistency, accessible primitives, no var() in className |
| Dev proxy | Vite `server.proxy` | `/api/go`→:8080, `/api/node`→:3000 — zero CORS needed in dev |
| Validation | Zod | Type inference from schemas, shared form/API contracts |
| Testing | Vitest (unit/hooks) + Playwright (E2E) | Native ESM, multi-browser smoke tests |

## Route Map (8 routes — matches web-layout spec Requirement #2)

| Route | Component | Auth | Description |
|---|---|---|---|
| `/login` | `LoginForm` | ❌ | Public: username/password form, redirects to `/devices` on success |
| `/` | `IndexRoute` | ✅ | Redirects to `/devices` (landing page) |
| `/devices` | `DeviceList` | ✅ | Table of all devices, "Add Device" CTA, empty/error states |
| `/devices/$id` | `DeviceDetail` | ✅ | Full device card, events for this device, edit/delete actions |
| `/devices/create` | `DeviceCreate` | ✅ | Zod-validated form, POST /devices, redirect to detail on success |
| `/events` | `EventList` + `EventForm` | ✅ | Event table with device filter, manual event creation form |
| `/dashboards` | `HealthCards` + `MetricsCards` | ✅ | Health status (green/red) for both services + metrics cards (requests_total, errors_total, uptime) with 30s auto-refresh |
| `/settings` | `SettingsView` | ✅ | Displays current configuration (read-only summary) |
| `*` | `NotFound` | — | 404 page with link back to home |

**Protected route enforcement**: `__root.tsx` beforeLoad checks `AuthContext.isAuthenticated`, redirects to `/login` if false.

## Data Flow & CORS Strategy

```
User → Route (container) → TanStack Query Hook → API Client (Bearer token)
  → Vite Proxy (dev) or direct (prod) → Backend → JSON Response
  → TanStack Query Cache → Component re-render

Auth: login() → POST /api/go/auth/login → localStorage + AuthContext → redirect /devices
401 interceptor: API client catches 401 → useContext(AuthContext).logout() → redirect /login
```

**Development**: Vite proxy (`server.proxy`) sidesteps CORS entirely — browser sees same-origin requests.

**Production prerequisite**: Add CORS middleware to `go-service/internal/interfaces/middleware.go`:
- `Access-Control-Allow-Origin: *` (or specific origin)
- `Access-Control-Allow-Headers: Authorization, Content-Type`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

Wire into `go-service/cmd/main.go` as the outermost middleware (before LoggingMiddleware). Node.js already serves CORS headers.

**Alternative**: nginx reverse proxy for production — same-origin, no CORS needed. Decision deferred to sdd-tasks (simpler ops for HN demo).

## Directory Structure

```
web-ui/src/
├── main.tsx                    # Vite entry, mounts <App/>
├── App.tsx                     # QueryClientProvider + AuthProvider + RouterProvider
├── routeTree.gen.ts            # Auto-generated by TanStack Router CLI
├── lib/
│   ├── api/
│   │   ├── client.ts           # fetch wrapper: base URL, Bearer, 401 interceptor
│   │   ├── auth.ts             # login(username, password) → {token}
│   │   ├── devices.ts          # CRUD functions: list, get, create, update, delete
│   │   ├── events.ts           # list(deviceId?), create(event)
│   │   ├── health.ts           # getHealth(service) → {status}
│   │   └── metrics.ts          # getMetrics(service) → {requests_total, errors_total}
│   ├── schemas/
│   │   ├── auth.ts             # loginSchema, TokenResponse
│   │   ├── device.ts           # deviceSchema, Device, CreateDeviceInput
│   │   └── event.ts            # eventSchema, Event, CreateEventInput
│   └── utils/
│       └── cn.ts               # clsx + tailwind-merge wrapper
├── hooks/
│   ├── use-auth.ts             # login/logout mutations, wraps AuthContext
│   ├── use-devices.ts          # useDevices, useDevice(id), mutations with invalidation
│   ├── use-events.ts           # useEvents(deviceId?), useCreateEvent
│   ├── use-health.ts           # useGoHealth, useNodeHealth (refetchInterval: 30s)
│   └── use-metrics.ts          # useGoMetrics, useNodeMetrics (staleTime: 60s)
├── context/
│   └── AuthContext.tsx         # { token, isAuthenticated, login, logout }
├── routes/
│   ├── __root.tsx              # Layout shell + auth guard (beforeLoad)
│   ├── login.tsx               # Login container
│   ├── index.tsx               # Redirect to /devices
│   ├── devices.tsx             # Device list container
│   ├── devices.$id.tsx         # Device detail container
│   ├── devices.create.tsx      # Device create container
│   ├── events.tsx              # Events container (list + form)
│   ├── dashboards.tsx          # Dashboards container (health + metrics cards)
│   ├── settings.tsx            # Settings container
│   └── $.tsx                   # 404 catch-all
└── components/
    ├── layout/
    │   ├── Sidebar.tsx          # Sidebar component
    │   ├── Header.tsx           # Header component
    │   └── AppLayout.tsx        # Layout component
    ├── devices/
    │   ├── DeviceTable.tsx      # DeviceTable component
    │   ├── DeviceCard.tsx       # DeviceCard component
    │   └── DeviceForm.tsx       # DeviceForm component
    ├── events/
    │   ├── EventTable.tsx       # EventTable component
    │   └── EventForm.tsx        # EventForm component
    ├── dashboards/
    │   ├── HealthCard.tsx       # HealthCard component
    │   └── MetricsCard.tsx      # MetricsCard component
    └── shared/
        ├── ErrorBoundary.tsx    # ErrorBoundary component
        ├── LoadingSkeleton.tsx  # LoadingSkeleton component
        └── EmptyState.tsx       # EmptyState component
```

## Query Hooks

| Hook | Query Key | Stale/Refetch | Invalidation trigger |
|---|---|---|---|
| `useDevices` | `['devices']` | staleTime 30s | Create/update/delete |
| `useDevice(id)` | `['devices', id]` | staleTime 30s | Update/delete |
| `useCreateDevice` | mutation | — | invalidate `['devices']` |
| `useUpdateDevice` | mutation | — | invalidate `['devices']` + `['devices', id]` |
| `useDeleteDevice` | mutation | — | invalidate `['devices']` |
| `useEvents(deviceId?)` | `['events', deviceId]` | staleTime 30s | Create |
| `useCreateEvent` | mutation | — | invalidate `['events']` |
| `useGoHealth` | `['health', 'go']` | refetchInterval 30s | — |
| `useNodeHealth` | `['health', 'node']` | refetchInterval 30s | — |
| `useGoMetrics` | `['metrics', 'go']` | staleTime 60s | — |
| `useNodeMetrics` | `['metrics', 'node']` | staleTime 60s | — |

## Testing Strategy

| Layer | Tool | What |
|---|---|---|
| Schemas (Zod) | Vitest | Valid/invalid/edge payloads — shape enforcement |
| Utils | Vitest | Pure functions: `cn()`, date formatters |
| Hooks | Vitest + React Testing Library | Mock API client, verify query keys, mutation side-effects |
| API client | Vitest + MSW | Auth header injection, 401→logout, error mapping |
| Components | Vitest + React Testing Library | Loading/empty/error states per spec; props rendering |
| E2E | Playwright | Login→CRUD→dashboards→events smoke across both services |

## File Changes

| File | Action | Description |
|---|---|---|
| `web-ui/` (~45 files) | Create | Entire frontend application |
| `go-service/internal/interfaces/middleware.go` | Modify | Add CORS middleware function |
| `go-service/cmd/main.go` | Modify | Wire CORS middleware as outermost wrapper |
| `docker-compose.yml` | Modify | Add web-ui service + proxy config |
| `k8s/web-deployment.yaml` | Create | Kubernetes deployment + service for web-ui |
| `k8s/ingress.yaml` | Modify | Add web-ui route if using ingress |

## Open Questions

1. **Metrics format**: Backend returns JSON counters (not Prometheus text). UI displays available fields — no parsing needed.
2. **Device entity fields**: Go returns `{id, name, type, createdAt}` — UI shows what backend provides. Spec mentions `status`/`last_seen` which don't exist yet.
3. **Node.js /events unauthenticated**: Accepted for now; auth on Node.js is a separate future phase.
4. **No pagination**: Lists return all rows; documented as known limitation per proposal scope.
