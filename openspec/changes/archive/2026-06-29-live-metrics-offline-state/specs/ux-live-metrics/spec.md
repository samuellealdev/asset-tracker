# Delta for ux-live-metrics

## ADDED Requirements

### Requirement: classifyHealth() Utility

The system MUST provide a pure function `classifyHealth(error: unknown, data?: {status: string})` returning `"healthy" | "offline" | "unhealthy" | "stale"`.

Classification rules:
- `error` is `TypeError` (network failure) → `"offline"`
- `error` thrown with HTTP status and `!response.ok` → `"unhealthy"`
- `data !== undefined` AND `isError === true` (stale cache) → `"stale"`
- `data?.status === "ok"` AND `!isError` → `"healthy"`

#### Scenario: Healthy service

- GIVEN `error` is null and `data.status === "ok"`
- WHEN `classifyHealth(null, { status: "ok" })` is called
- THEN it returns `"healthy"`

#### Scenario: Network error (offline)

- GIVEN `error` is a `TypeError` from a failed fetch
- WHEN `classifyHealth(typeErrorInstance, undefined)` is called
- THEN it returns `"offline"`

#### Scenario: Unhealthy backend

- GIVEN `error` has `status: 503` and `body`, `data` is undefined
- WHEN `classifyHealth({ status: 503, body: {} }, undefined)` is called
- THEN it returns `"unhealthy"`

#### Scenario: Stale cached data

- GIVEN `error` is non-null (any type), `data.status === "ok"` (cached)
- WHEN `classifyHealth(new Error("timeout"), { status: "ok" })` is called
- THEN it returns `"stale"`

#### Scenario: TypeError detection across bundlers

- GIVEN a non-instanceof network error where `error.message` includes "fetch"
- WHEN `classifyHealth({ message: "fetch failed" }, undefined)` is called
- THEN it returns `"offline"`

### Requirement: HealthDot Component

The `HealthDot` component MUST accept `status: "healthy" | "offline" | "unhealthy" | "stale"` and `label: string`, rendering a colored dot with aria-label. Color mapping:

| status | Tailwind class |
|--------|---------------|
| healthy | `bg-green-500` |
| offline | `bg-gray-400` |
| unhealthy | `bg-red-500` |
| stale | `bg-amber-400` |

#### Scenario: Each status renders correct color

- GIVEN `status` is `"offline"`
- WHEN `HealthDot` renders
- THEN the dot has `bg-gray-400` class and aria-label includes "offline"

#### Scenario: Tooltip reflects status

- GIVEN any `status` value
- WHEN the dot is rendered
- THEN the `title` attribute shows the human-readable status (e.g., "Healthy", "Offline", "Unhealthy", "Stale")

### Requirement: ServiceDetailCard Modal

The `ServiceDetailCard` MUST reflect the correct status classification when opened, matching the dot color shown in the LiveMetrics bar.

#### Scenario: Modal shows offline status

- GIVEN Go service is offline
- WHEN the user clicks the Go service button
- THEN the modal's health badge shows a gray dot with "Offline" label

#### Scenario: Modal shows stale status

- GIVEN Node service has stale data
- WHEN the user clicks the Node service button
- THEN the modal's health badge shows an amber dot with "Stale" label

## MODIFIED Requirements

### Requirement: Health Indicators

The system MUST display health status dots for Go (:8080) and Node.js (:3000) services, polling every 2s by default. Each service MUST be classified as `healthy`, `offline`, `unhealthy`, or `stale` via `classifyHealth()`. A priority-based badge MUST appear in the top bar when any service is not healthy: Offline > Unhealthy > Stale. When all services are healthy, no badge is shown.

(Previously: binary healthy/unhealthy classification with a single amber "Stale" badge for any error)

#### Scenario: All healthy

- GIVEN both health endpoints return `{status: "ok"}`
- WHEN the next poll cycle completes
- THEN two green dots render, no top-bar badge appears

#### Scenario: Go offline

- GIVEN Go /health fetch throws TypeError, Node is healthy
- WHEN the next poll cycle completes
- THEN Go dot is gray, top-bar shows gray "Offline" badge

#### Scenario: Node unhealthy

- GIVEN Node /health returns 503, Go is healthy
- WHEN the next poll cycle completes
- THEN Node dot is red, top-bar shows red "Unhealthy" badge

#### Scenario: Go stale

- GIVEN Go query errored but stale cache exists, Node is healthy
- WHEN the next poll cycle completes
- THEN Go dot is amber, top-bar shows amber "Stale" badge

#### Scenario: Badge priority — offline over unhealthy

- GIVEN Go is offline (TypeError), Node is unhealthy (503 response)
- WHEN the metrics bar renders
- THEN top-bar shows only the gray "Offline" badge (not the red "Unhealthy" badge)

#### Scenario: Badge priority — unhealthy over stale

- GIVEN Go is unhealthy (500 response), Node has stale cached data
- WHEN the metrics bar renders
- THEN top-bar shows only the red "Unhealthy" badge (not the amber "Stale" badge)

#### Scenario: Transition from healthy to offline

- GIVEN both services are healthy (green dots, no badge)
- WHEN Go /health suddenly throws TypeError
- THEN Go dot transitions from green to gray, top-bar shows gray "Offline" badge

#### Scenario: Transition from offline to healthy

- GIVEN Go is offline (gray dot, "Offline" badge shown), Node is healthy
- WHEN Go /health recovers and returns `{status: "ok"}`
- THEN Go dot transitions from gray to green, badge reverts to Node's state or disappears if all healthy

#### Scenario: Concurrent network errors

- GIVEN both Go and Node /health throw TypeError simultaneously
- WHEN the metrics bar renders
- THEN both dots are gray, top-bar shows one gray "Offline" badge

#### Scenario: Polling disabled

- GIVEN health interval set to 0 in settings
- WHEN bar renders
- THEN dots show last known state with last known classification, no polling
