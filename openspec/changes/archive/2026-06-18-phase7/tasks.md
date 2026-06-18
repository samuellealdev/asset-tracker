# Tasks: Phase 7 — JWT Authentication

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full Phase 7 — JWT auth | Single PR | ~300 lines, dependencies are linear |

## Phase 1: Dependencies

- [x] 1.1 Add `github.com/golang-jwt/jwt/v5` to `go-service/go.mod` via `go get`
- [x] 1.2 Add `AUTH_USERNAME` and `AUTH_PASSWORD` vars to `.env.example`

## Phase 2: Auth Middleware (test-first)

- [x] 2.1 RED: Write `auth_middleware_test.go` — valid token → 200, expired → 401, missing header → 401, malformed Bearer → 401, wrong secret → 401, context injection
- [x] 2.2 GREEN: Create `auth_middleware.go` — `contextKey`, `UsernameKey`, `NewAuthMiddleware(jwtSecret []byte) func(http.Handler) http.Handler`, Bearer extraction + `jwt.ParseWithClaims(MapClaims)`
- [x] 2.3 Verify `go test ./...` passes

## Phase 3: Auth Handler (test-first)

- [x] 3.1 RED: Write `auth_handler_test.go` — valid creds → 200+JWT, wrong password → 401, missing fields → 400, malformed JSON → 400
- [x] 3.2 GREEN: Create `auth_handler.go` — `AuthHandler` struct, `NewAuthHandler(username, password string, jwtSecret []byte, expiration time.Duration)`, `HandleLogin`: decode body, validate creds, sign JWT with `sub`/`exp`/`iat`, return 200+token
- [x] 3.3 Verify `go test ./...` passes

## Phase 4: Wire Middleware into DeviceHandler

- [x] 4.1 Change `NewDeviceHandler` signature: add `authMiddleware func(http.Handler) http.Handler` (nil-safe)
- [x] 4.2 Wrap `POST/PUT/DELETE /devices` with `authMiddleware` in constructor; `GET` routes unchanged
- [x] 4.3 Update `device_handler_test.go`: pass `nil` as second arg in all constructor calls
- [x] 4.4 Add auth subtests: POST without token → 401, POST with token → 201, DELETE without token → 401, GET → 200 (public)

## Phase 5: Wiring — main.go

- [x] 5.1 Read `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION` env vars; default expiration=1h; exit if `JWT_SECRET` missing
- [x] 5.2 Construct `AuthHandler`, register `POST /auth/login` on top-level mux
- [x] 5.3 Construct `authMiddleware := NewAuthMiddleware([]byte(jwtSecret))`; pass to `NewDeviceHandler(useCases, authMiddleware)`

## Phase 6: Verification

- [x] 6.1 Run `go test ./...` — all tests pass, zero regressions
- [x] 6.2 Acceptance: POST /auth/login valid → 200+JWT, wrong password → 401
- [x] 6.3 Acceptance: POST /devices no token → 401, with token → 201, GET /devices → 200, GET /health → 200
- [x] 6.4 `docker compose up --build` succeeds, go-service healthy
- [x] 6.5 Update `README.md` — Phase 7 summary + login curl example
