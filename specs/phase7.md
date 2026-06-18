# Phase 7: JWT Authentication

## Objective

Add JSON Web Token (JWT) authentication to the Go service. Protect write endpoints (`POST`, `PUT`, `DELETE /devices`) behind a JWT middleware while keeping read endpoints (`GET /devices`, `/health`, `/metrics`) public. Introduce a `POST /auth/login` endpoint that validates credentials and returns a signed JWT token.

## Technical Requirements

- **Login endpoint**: `POST /auth/login` accepts `{"username": "...", "password": "..."}`. On valid credentials, returns HTTP 200 with `{"token": "<jwt>"}`. On invalid credentials, returns HTTP 401 with `{"error": "invalid credentials"}`.
- **JWT token**: Signed with HMAC-SHA256 using `JWT_SECRET` environment variable. Payload contains `sub` (username) and `exp` (expiration timestamp). Default expiration: 1 hour (configurable via `JWT_EXPIRATION` env var).
- **Auth middleware**: Extracts and validates the JWT from the `Authorization: Bearer <token>` header. On valid token, injects username into request context and calls next handler. On missing/invalid/expired token, returns HTTP 401 with `{"error": "..."}`.
- **Protected endpoints**: `POST /devices`, `PUT /devices/:id`, `DELETE /devices/:id` MUST require a valid JWT. The middleware MUST be applied only to these routes.
- **Public endpoints**: `GET /devices`, `GET /devices/:id`, `/health`, `/health/live`, `/health/ready`, `/metrics` remain public.
- **Credentials storage**: For this demo, credentials are stored as environment variables: `AUTH_USERNAME` and `AUTH_PASSWORD`. No database table for users. This keeps the scope minimal.
- **Testing**: Unit tests for login handler (valid, invalid, missing fields). Unit tests for middleware (valid token, expired token, missing header, malformed header). Integration test: unauthenticated POST /devices → 401, authenticated → 201.
- **Backward compatible**: All existing endpoints that were public remain public. Only write operations now require authentication.
- **Library**: Use `github.com/golang-jwt/jwt/v5` for JWT operations.

## Files to Create

- `go-service/internal/interfaces/auth_handler.go` — `POST /auth/login` handler
- `go-service/internal/interfaces/auth_handler_test.go` — Tests for login handler
- `go-service/internal/interfaces/auth_middleware.go` — JWT validation middleware
- `go-service/internal/interfaces/auth_middleware_test.go` — Tests for middleware

## Files to Modify

- `go-service/cmd/main.go` — Register `/auth/login` route, wrap write endpoints with auth middleware, read `JWT_SECRET`, `JWT_EXPIRATION`, `AUTH_USERNAME`, `AUTH_PASSWORD` env vars
- `go-service/go.mod` — Add `github.com/golang-jwt/jwt/v5` dependency
- `go-service/.env.example` — Already has `JWT_SECRET` and `JWT_EXPIRATION`; add `AUTH_USERNAME` and `AUTH_PASSWORD`
- `README.md` — Add Phase 7 to summary table, update Quick Start with login example
- `specs/README.md` — Add Phase 7 to phase index

## Acceptance Criteria

- [ ] `go test ./...` passes all tests (existing + new).
- [ ] `curl -X POST http://localhost:8080/devices -d '{"name":"test","type":"test"}'` returns HTTP 401 (unauthorized).
- [ ] `curl -X POST http://localhost:8080/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin"}'` returns HTTP 200 with a valid JWT token.
- [ ] `curl -X POST http://localhost:8080/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"wrong"}'` returns HTTP 401.
- [ ] `TOKEN=$(curl -s -X POST .../auth/login ... | jq -r '.token'); curl -X POST http://localhost:8080/devices -H "Authorization: Bearer $TOKEN" -d '{"name":"test","type":"test"}'` returns HTTP 201 (authorized).
- [ ] `curl -X DELETE http://localhost:8080/devices/<id>` returns HTTP 401.
- [ ] `TOKEN=...; curl -X DELETE http://localhost:8080/devices/<id> -H "Authorization: Bearer $TOKEN"` returns HTTP 204.
- [ ] `curl http://localhost:8080/devices` returns HTTP 200 (GET remains public).
- [ ] `curl http://localhost:8080/health` returns HTTP 200 (health remains public).
- [ ] `curl -X POST http://localhost:8080/devices -H "Authorization: Bearer invalidtoken"` returns HTTP 401.
- [ ] `docker compose up --build` succeeds with go-service healthy.

## Constraints

- JWT library MUST be `golang-jwt/jwt/v5` (the maintained fork, not `dgrijalva/jwt-go` which is unmaintained).
- Auth middleware MUST be applied per-route, not globally — GET endpoints must remain public.
- Credentials MUST be read from environment variables (`AUTH_USERNAME`, `AUTH_PASSWORD`), not hardcoded.
- JWT secret MUST be read from `JWT_SECRET` environment variable.
- Token expiration MUST be configurable via `JWT_EXPIRATION` env var with default of 1 hour.
- Error responses MUST return JSON `{"error": "message"}` consistent with existing error format.
- Existing tests MUST continue to pass — backward compatibility is mandatory.

## Notes

- This phase adds authentication to the existing Go service without changing the Node service.
- The login endpoint is intentionally simple (single user, env var credentials). A production system would use a database-backed user store with hashed passwords.
- The auth middleware pattern (per-route wrapping) follows the same approach as the existing `LoggingMiddleware`.
- JWT tokens are stateless — no session storage, no refresh tokens, no logout endpoint. This keeps the scope minimal for a demo while demonstrating the core concept.
