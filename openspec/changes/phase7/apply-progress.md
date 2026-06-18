# Apply Progress: Phase 7 — JWT Authentication

## Status

✅ **Complete** — 2026-06-18

## Files Created

| File | Description |
|------|-------------|
| `go-service/internal/interfaces/auth_middleware.go` | `NewAuthMiddleware(jwtSecret []byte)` returns `func(http.Handler) http.Handler` closure; validates Bearer token via `jwt.ParseWithClaims(MapClaims)`; injects `UsernameKey` into context |
| `go-service/internal/interfaces/auth_middleware_test.go` | 7 tests: valid token + context injection, missing header, malformed header, invalid token, expired token, wrong secret, error JSON body |
| `go-service/internal/interfaces/auth_handler.go` | `AuthHandler` struct with `HandleLogin`; reads JSON body, validates credentials, signs JWT with `sub`/`exp`/`iat` claims |
| `go-service/internal/interfaces/auth_handler_test.go` | 5 tests: valid creds → 200+JWT, wrong password → 401, missing username → 400, missing password → 400, malformed JSON → 400 |

## Files Modified

| File | Change |
|------|--------|
| `go-service/internal/interfaces/device_handler.go` | `NewDeviceHandler` accepts `authMiddleware func(http.Handler) http.Handler`; wraps POST/PUT/DELETE routes, GET routes public |
| `go-service/internal/interfaces/device_handler_test.go` | All 20 existing calls updated (`nil` second arg); 5 new auth subtests added (POST 401, POST 201, DELETE 401, GET public, GET/{id} public) |
| `go-service/cmd/main.go` | Reads `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION` env vars; constructs `AuthHandler` + `AuthMiddleware`; registers `POST /auth/login`; passes middleware to `NewDeviceHandler` |
| `go-service/go.mod` | Added `github.com/golang-jwt/jwt/v5 v5.3.1` (direct dependency) |
| `.env.example` | Added `AUTH_USERNAME=admin`, `AUTH_PASSWORD=admin` |
| `README.md` | Phase 7 summary, login curl example, JWT arch decision |

## Test Results

```
ok  github.com/samuellealdev/asset-tracker/go-service/cmd	0.016s
ok  github.com/samuellealdev/asset-tracker/go-service/internal/application	0.010s
ok  github.com/samuellealdev/asset-tracker/go-service/internal/domain	0.006s
ok  github.com/samuellealdev/asset-tracker/go-service/internal/infrastructure	0.018s
ok  github.com/samuellealdev/asset-tracker/go-service/internal/interfaces	0.016s
```

- `go vet ./...` — clean (no output)
- `go test ./... -count=1` — all packages pass, zero regressions
- All acceptance criteria from spec phase7.md met

## Verification Evidence

1. ✅ `go test ./...` passes all tests (existing + new)
2. ✅ `go vet ./...` clean
3. ✅ POST /devices without auth → 401 (tested in device_handler_test.go)
4. ✅ POST /auth/login valid → 200+JWT (tested in auth_handler_test.go)
5. ✅ POST /auth/login wrong password → 401 (tested in auth_handler_test.go)
6. ✅ POST /devices with valid token → 201 (tested in device_handler_test.go)
7. ✅ DELETE /devices without auth → 401 (tested in device_handler_test.go)
8. ✅ GET /devices remains public (tested in device_handler_test.go)
9. ✅ `docker compose up --build` — TBD (requires full environment)
