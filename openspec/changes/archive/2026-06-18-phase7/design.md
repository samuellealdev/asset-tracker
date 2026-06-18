# Design: Phase 7 — JWT Authentication

## Technical Approach

Add JWT auth to the Go service via three new interface-layer components: `AuthHandler` (login), `AuthMiddleware` (token validation), and typed context keys. Inject credentials and JWT config from `main.go` via constructor parameters — no global state, no env reads inside the interfaces layer. Per-route wrapping: all `/devices` routes pass through `AuthMiddleware`. `/health/*` and `/metrics` remain unwrapped.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Wrap routes inside `DeviceHandler` vs. at top mux in `main.go` | Inside: encapsulation, one change. Top mux: visible wiring, more main.go diff | **Inside `DeviceHandler`** — follows existing encapsulation; `LoggingMiddleware` already wraps globally at top mux |
| Closure factory `NewAuthMiddleware(secret, expiry)` vs. config struct | Closure is simpler, immutable after construction. Struct allows future injection | **Closure factory** — no need for future injection; single user model |
| Typed context key (`type contextKey string`) vs. plain string | Typed prevents collisions; standard Go pattern | **Typed key** — `UsernameKey contextKey = "username"` |
| `MapClaims` vs. registered `Claims` struct | MapClaims is minimal for 3 fields (sub, exp, iat). Registered struct adds type safety but boilerplate | **MapClaims** — spec only needs sub/exp/iat; library's `RegisteredClaims` embeds standard fields but we keep it simple |

## Data Flow

```
POST /auth/login
      │
      ▼
AuthHandler.HandleLogin()
      │ reads {username, password} from body
      ├─ invalid JSON / missing fields → 400
      ├─ wrong credentials → 401 {"error":"invalid credentials"}
      └─ valid → create JWT (sub, exp, iat)
              → 200 {"token":"<jwt>"}

POST/PUT/DELETE /devices
      │
      ▼
AuthMiddleware (wraps handler)
      │ extracts "Authorization: Bearer <token>"
      ├─ missing/malformed header → 401 {"error":"missing authorization header"}
      ├─ invalid/expired signature → 401 {"error":"invalid or expired token"}
      └─ valid → inject username via context.WithValue(ctx, UsernameKey, sub)
              → next.ServeHTTP(w, r)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `go-service/internal/interfaces/auth_handler.go` | Create | `AuthHandler` struct with `HandleLogin`, constructor receives `username, password, jwtSecret, jwtExpiration` |
| `go-service/internal/interfaces/auth_handler_test.go` | Create | Tests: valid login, wrong password, missing fields, malformed JSON |
| `go-service/internal/interfaces/auth_middleware.go` | Create | `NewAuthMiddleware(jwtSecret)` returns `func(http.Handler) http.Handler`; validates Bearer token, injects `UsernameKey` into context |
| `go-service/internal/interfaces/auth_middleware_test.go` | Create | Tests: valid token passes, expired token 401, missing header 401, malformed header 401, invalid signature 401 |
| `go-service/internal/interfaces/device_handler.go` | Modify | `NewDeviceHandler` accepts optional `authMiddleware func(http.Handler) http.Handler`; wraps `POST/PUT/DELETE` with it, `GET` routes unchanged |
| `go-service/internal/interfaces/device_handler_test.go` | Modify | Handler construction updated (pass `nil` for auth in existing tests — GET routes unaffected) |
| `go-service/cmd/main.go` | Modify | Read `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION`; construct `AuthHandler`, `AuthMiddleware`; register `POST /auth/login`; pass auth middleware to `NewDeviceHandler` |
| `go-service/go.mod` | Modify | Add `github.com/golang-jwt/jwt/v5` |
| `.env.example` | Modify | Add `AUTH_USERNAME`, `AUTH_PASSWORD` |

## Interfaces / Contracts

### Context key

```go
type contextKey string
const UsernameKey contextKey = "username"
```

Exported constant lives in `auth_middleware.go`. Callers retrieve via `r.Context().Value(interfaces.UsernameKey)`.

### `AuthMiddleware` factory

```go
func NewAuthMiddleware(jwtSecret []byte) func(http.Handler) http.Handler
```

Matches `LoggingMiddleware` signature — composable with existing wrapping patterns.

### `DeviceHandler` constructor change

```go
// Before
func NewDeviceHandler(useCases DeviceUseCases) *DeviceHandler

// After
func NewDeviceHandler(useCases DeviceUseCases, authMiddleware func(http.Handler) http.Handler) *DeviceHandler
```

`nil` authMiddleware disables protection (all routes public). Tests pass `nil`; `main.go` passes real middleware.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Interface unit (auth_handler) | Login: valid creds → 200+JWT, invalid → 401, missing fields → 400, malformed JSON → 400 | `httptest` with table-driven subtests (match existing pattern) |
| Interface unit (auth_middleware) | Valid token passes, expired → 401, missing header → 401, malformed → 401, wrong secret → 401, context injection verified | `httptest`; generate tokens with known secret in test |
| Interface unit (device_handler) | Existing business-logic tests pass unchanged; all device routes without token → 401, with valid token → 200/201/204 → 200/201/204, without token → 401 | Extend `device_handler_test.go` with new subtests using real middleware |

## Migration / Rollout

No migration required. Rollback: revert `main.go` to pass `nil` as auth middleware to `NewDeviceHandler`, remove `/auth/login` registration. All device routes become public again. No data changes.

## Architectural Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Envar leakage**: JWT_SECRET in env vars is plaintext. | Low | Acceptable for demo phase; production would use secret manager. Documented in spec notes. |
| **No token revocation**: Stateless JWT means no logout endpoint. | Low | By design per spec. Token lifetime (default 1h) limits exposure window. |
| **Context key collision**: `UsernameKey` could collide with other context users. | Low | Typed context key (`type contextKey string`) prevents collisions per Go conventions. |
| **Existing test breakage**: `NewDeviceHandler` signature change affects all call sites. | Low | Only two call sites: `main.go` and `device_handler_test.go`. Adding parameter with `nil` default behavior. |
