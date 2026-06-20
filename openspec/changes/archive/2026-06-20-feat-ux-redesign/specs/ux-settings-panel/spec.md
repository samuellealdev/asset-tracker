# ux-settings-panel Specification

## Purpose
Slide-out panel with API configuration, auth status, and logout. Opened from the TopBar gear icon.

## Requirements

### Requirement: Panel Open/Close
The system MUST render a slide-out panel from the right when the gear icon is clicked.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Open | gear icon clicked | panel animates in | panel slides from right edge, overlay behind |
| Close via gear | panel open | gear icon clicked again | panel slides closed |
| Close via Escape | panel open | user presses Escape | panel slides closed |
| Close via overlay | panel open | user clicks overlay backdrop | panel slides closed |

### Requirement: Polling Interval Configuration
The system MUST allow configuring health and metrics polling intervals, persisted in localStorage.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Default intervals | panel opens | — | health shows 2s, metrics shows 5s |
| Change health interval | panel open | user sets health to 10s and saves | LiveMetrics health refreshes every 10s |
| Change metrics interval | panel open | user sets metrics to 15s and saves | LiveMetrics metrics refresh every 15s |
| Persist across reload | intervals changed and saved | page reloads | restored intervals from localStorage apply |
| Invalid input | user enters "abc" | saves | validation error, interval unchanged |

### Requirement: Auth Status Display
The system MUST show current auth status and logout option.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Authenticated | valid JWT | panel opens | "Authenticated" status with user info shown |
| Logout | panel open | user clicks logout | JWT cleared, redirect to /login, panel closes |
| Token expired | JWT expired | panel opens | "Session expired" status, re-login prompt |

### Requirement: API Base URL Configuration
The system MAY allow configuring API base URLs.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Default URLs | panel opens | — | Go API default (localhost:8080) and Node.js API default (localhost:3000) shown |
| Change URLs | user modifies URL | saves | future API calls use new URL, persisted to localStorage |
