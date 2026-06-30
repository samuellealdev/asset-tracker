# web-dashboards Specification

## Purpose
Health and Prometheus-metrics monitoring dashboards for both backend services.

## Requirements

### Requirement: Health Dashboard
The system MUST poll /health/live and /health/ready for Go (:8080) and Node.js (:3000) every 30 seconds.

#### Scenario: All healthy
- GIVEN both endpoints return HTTP 200
- WHEN the dashboard loads
- THEN each service displays a green "Healthy" indicator with last-check timestamp

#### Scenario: Service unhealthy
- GIVEN one endpoint returns non-200 or times out
- WHEN the dashboard polls health
- THEN that service displays a red "Unhealthy" indicator

#### Scenario: Auto-refresh
- GIVEN the health dashboard is visible
- THEN health checks auto-refresh every 30 seconds

### Requirement: Metrics Dashboard
The system MUST fetch and display Prometheus metrics from both services.

#### Scenario: Metrics loaded
- GIVEN user navigates to the metrics dashboard
- WHEN GET /metrics returns Prometheus data
- THEN key metrics (uptime_seconds, http_requests_total, errors_total) are displayed in cards

#### Scenario: Metrics unavailable
- GIVEN a service is down
- WHEN GET /metrics fails
- THEN that service panel displays "Metrics unavailable" error state
