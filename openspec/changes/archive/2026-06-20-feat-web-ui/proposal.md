# Proposal: Web UI Frontend

## Intent

The asset-tracker backend (Go + Node.js, 7 phases complete) has no user-facing interface. All interactions require curl/HTTP clients. We need a modern SPA that exposes full system functionality — device CRUD, event tracking, health monitoring, and metrics — through an intuitive web interface. The UI must be elegant, responsive, and production-quality from day one.

## Scope

### In Scope
- Login/logout with JWT authentication
- Device CRUD: list, view, create, edit, delete
- Event viewing (filter by device) and manual event logging
- Health dashboards for both Go and Node.js services
- Metrics display (Prometheus-format metrics from both services)
- Settings/configuration summary page

### Out of Scope
- Pagination/infinite scroll (backend has no pagination yet)
- Admin user management (only single-user login)
- Real-time updates (WebSockets/SSE)
- Dark mode toggle
- i18n/localization
- PWA/offline mode

## Capabilities

### New Capabilities
- `web-auth`: JWT login/logout flow, token storage, protected routes
- `web-devices`: Full CRUD UI for /devices endpoints
- `web-events`: Event viewer and manual event form
- `web-dashboards`: Health and metrics dashboards for both services
- `web-layout`: App shell with navigation, routing, and responsive design

### Modified Capabilities
None. This is a new service with no existing specs.

## Approach

React 19 SPA with Vite bundling. TanStack Router for type-safe routing, TanStack Query for server state (caching, refetch, optimistic updates). Tailwind CSS 4 + shadcn/ui for styling. Zod for form validation. Vitest for unit/integration tests, Playwright for smoke tests. TypeScript strict mode throughout. All components follow Presentational/Container pattern with SOLID principles.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/` | New | Entire frontend application |
| `go-service/internal/interfaces/` | Modified | Add CORS middleware for browser requests |
| `docker-compose.yml` | Modified | Add web service definition |
| `k8s/` | Modified | Add web deployment + service manifests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Go service lacks CORS headers — browser blocks all /devices and /auth calls | High | Add CORS middleware to Go service as prerequisite task |
| No pagination could cause perf issues with large device/event lists | Med | Document as known limitation; pagination is a future phase |
| Node.js /events endpoints unauthenticated — data exposure risk | Med | Accept for now; auth on Node.js is separate concern (future phase) |

## Rollback Plan

The frontend is a standalone service. Remove the `web/` directory, revert `docker-compose.yml` and `k8s/` changes. The backend services are unaffected — they continue serving API responses normally. No database migrations involved.

## Dependencies

- **Go service CORS middleware**: MUST add `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers` (Authorization, Content-Type), `Access-Control-Allow-Methods` to Go HTTP router before UI can function
- Both backend services running (Docker Compose or K8s)
- Kafka cluster operational (for event pipeline display)

## Success Criteria

- [ ] User can log in, receive JWT, and access protected routes
- [ ] Device CRUD: all 5 operations work end-to-end from UI to database
- [ ] Events list renders, manual event submission succeeds
- [ ] Health dashboard shows live status for both services
- [ ] Metrics dashboard renders both services' metrics
- [ ] TypeScript strict mode — no `any` types, no errors
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] Responsive layout works on desktop (1280px) and tablet (768px)
- [ ] Unit test coverage ≥ 70% on business logic (hooks, validators, utilities)
- [ ] All existing 190 backend tests still pass
