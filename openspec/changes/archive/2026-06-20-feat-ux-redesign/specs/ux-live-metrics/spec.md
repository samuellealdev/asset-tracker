# ux-live-metrics Specification

## Purpose
Always-visible compact metrics bar showing service health dots and request/error counters, with configurable refresh intervals.

## Requirements

### Requirement: Health Indicators
The system MUST display health status dots for Go (:8080) and Node.js (:3000) services, polling every 2s by default.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| All healthy | both endpoints return 200 | metrics bar renders | two green dots with "Go" and "Node" labels |
| Go unhealthy | Go /health fails | next poll cycle | Go dot turns red, "Unhealthy" tooltip |
| Node unhealthy | Node /health fails | next poll cycle | Node dot turns red, "Unhealthy" tooltip |
| Polling disabled | health interval set to 0 in settings | bar renders | dots show last known state, no polling |

### Requirement: Request/Error Counters
The system MUST display http_requests_total and errors_total from Prometheus metrics, polling every 5s by default.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Counters visible | metrics endpoint responds | bar renders | request and error counts for each service displayed |
| Metrics unavailable | GET /metrics fails | bar renders | "--" displayed for that service's counters |
| Polling active | bar visible | 5s elapses | counters refresh automatically |
| Configurable interval | settings change to 10s | — | counters refresh at new interval |

### Requirement: Compact Layout
The metrics bar MUST be compact, fitting within the TopBar area without requiring vertical scroll.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Desktop | viewport ≥ 1024px | bar renders | single row: [health dots] [request counters] [error counters] |
| Tablet | viewport 768-1023px | bar renders | single row with reduced spacing |
| Mobile | viewport < 768px | bar renders | compact icons only, counters on tap/hover |

### Requirement: Visibility
The LiveMetrics bar MUST be visible on all authenticated pages.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Devices page | user on /devices | page renders | metrics bar visible above/beside content |
| Dashboards page | user on /dashboards | page renders | metrics bar visible |
| Login page | user on /login | — | metrics bar NOT visible |
| Error page | 404/error renders | — | metrics bar visible if authenticated |
