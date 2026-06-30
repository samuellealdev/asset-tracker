# web-dashboards Specification

## Purpose
Health and Prometheus-metrics monitoring for both backend services, now shown in the always-visible LiveMetrics bar.

## Requirements

### Requirement: Health Dashboard
The system MUST poll /health/live and /health/ready for Go (:8080) and Node.js (:3000) at configurable intervals, defaulting to 2 seconds for health.

(Previously: polled every 30s with fixed interval)

#### Scenario: All healthy
- GIVEN both endpoints return HTTP 200
- WHEN health is polled
- THEN each service displays a green "Healthy" indicator in the LiveMetrics bar

#### Scenario: Service unhealthy
- GIVEN one endpoint returns non-200 or times out
- WHEN health is polled
- THEN that service displays a red "Unhealthy" indicator in the LiveMetrics bar

#### Scenario: Configurable refresh interval
- GIVEN the Settings panel is open
- WHEN user changes health polling interval and saves
- THEN health polls at the new interval, persisted in localStorage

### Requirement: Metrics Dashboard
The system MUST display key Prometheus metrics (uptime_seconds, http_requests_total, errors_total) in the always-visible LiveMetrics bar, refreshing at configurable intervals defaulting to 5 seconds.

(Previously: metrics displayed on separate /dashboards page at 30s)

#### Scenario: Metrics loaded in LiveMetrics bar
- GIVEN user is on any authenticated page
- WHEN metrics are fetched
- THEN request/error counters are visible in the LiveMetrics bar

#### Scenario: Metrics unavailable
- GIVEN a service is down
- WHEN GET /metrics fails
- THEN that service's counters display "—" or error indicator

#### Scenario: Configurable metrics refresh
- GIVEN the Settings panel is open
- WHEN user changes metrics polling interval and saves
- THEN metrics refresh at the new interval, persisted in localStorage
