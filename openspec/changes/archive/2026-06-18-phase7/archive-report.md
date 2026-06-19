# Archive Report: Phase 7 — JWT Authentication

**Archived**: 2026-06-18
**Updated**: 2026-06-19 (K8s deployment verification)
**Verification**: PASS (25/25 runtime tests, 62/62 Node tests, 4/5 Go packages)
**Engram observations**: `sdd/phase7/verify-report`

## Summary

Phase 7 added JWT authentication to the Go service, protecting all device endpoints (/devices/*) while keeping infrastructure endpoints (/health, /metrics) public. A `POST /auth/login` endpoint issues HMAC-SHA256 signed JWT tokens with configurable expiration. Deployed and verified on Kubernetes (Docker Desktop K8s v1.34.3) with 25 runtime acceptance tests passing.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| phase7 | Acceptance criteria checked | All 12 acceptance criteria marked [x] in `specs/phase7.md` including K8s deployment |
| phase7 | K8s verification added | 25 runtime tests passing on deployed cluster |

## Archive Contents

| Artifact | Path | Status |
|----------|------|--------|
| design.md | `openspec/changes/archive/2026-06-18-phase7/design.md` | ✅ |
| tasks.md | `openspec/changes/archive/2026-06-18-phase7/tasks.md` | ✅ (14/14 original + K8s verification) |
| apply-progress.md | `openspec/changes/archive/2026-06-18-phase7/apply-progress.md` | ✅ |
| verify-report.md | `openspec/changes/archive/2026-06-18-phase7/verify-report.md` | ✅ (PASS, updated with K8s results) |

## Files Changed

### Created (4)
- `go-service/internal/interfaces/auth_handler.go` — Login handler with JWT signing
- `go-service/internal/interfaces/auth_handler_test.go` — 5 subtests
- `go-service/internal/interfaces/auth_middleware.go` — Bearer token validation middleware
- `go-service/internal/interfaces/auth_middleware_test.go` — 7 subtests

### Modified (9)
- `go-service/internal/interfaces/device_handler.go` — Constructor accepts authMiddleware
- `go-service/internal/interfaces/device_handler_test.go` — 5 auth subtests added
- `go-service/cmd/main.go` — Reads 6 env vars, registers /auth/login, wires middleware
- `go-service/go.mod` — Added `golang-jwt/jwt/v5 v5.3.1`
- `.env.example` — Added AUTH_USERNAME, AUTH_PASSWORD
- `README.md` — Phase 7 summary, login curl example
- `specs/README.md` — Phase 7 added to index
- `specs/phase7.md` — All 12 acceptance criteria checked
- `k8s/secret.yaml` — JWT_SECRET, AUTH_USERNAME, AUTH_PASSWORD (base64 encoded)
- `k8s/configmap.yaml` — JWT_EXPIRATION added
- `k8s/go-service-deployment.yaml` — All 8 env vars (PORT, POSTGRES_DSN, KAFKA_BROKER, KAFKA_TOPIC, JWT_SECRET, JWT_EXPIRATION, AUTH_USERNAME, AUTH_PASSWORD)

## K8s Deployment Verification (2026-06-19)

### Cluster: Docker Desktop Kubernetes v1.34.3

All 6 pods healthy in `asset-tracker` namespace:

| Pod | Status | Image |
|-----|--------|-------|
| postgres | 1/1 Running | postgres:16-alpine |
| mongo | 1/1 Running | mongo:7 |
| kafka | 1/1 Running | apache/kafka:3.9.2 |
| go-service | 1/1 Running | asset-tracker-go-service:latest |
| node-service | 1/1 Running | asset-tracker-node-service:latest |
| kafka-create-topics | Completed | apache/kafka:3.9.2 |

### Env Var Injection (verified in pod spec)

| Env Var | Source | Verified |
|---------|--------|----------|
| JWT_SECRET | asset-tracker-secret / JWT_SECRET | ✅ |
| JWT_EXPIRATION | asset-tracker-config / JWT_EXPIRATION | ✅ |
| AUTH_USERNAME | asset-tracker-secret / AUTH_USERNAME | ✅ |
| AUTH_PASSWORD | asset-tracker-secret / AUTH_PASSWORD | ✅ |
| POSTGRES_DSN | asset-tracker-secret / POSTGRES_DSN | ✅ |
| KAFKA_BROKER | asset-tracker-config / KAFKA_BROKER | ✅ |
| KAFKA_TOPIC | asset-tracker-config / KAFKA_TOPIC | ✅ |
| PORT | asset-tracker-config / GO_PORT | ✅ |

### Runtime Test Results Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Auth login | 5 | 5 | 0 |
| Device CRUD (no auth) | 4 | 4 | 0 |
| Device CRUD (with auth) | 4 | 4 | 0 |
| Invalid token scenarios | 2 | 2 | 0 |
| Public endpoints | 4 | 4 | 0 |
| Node service | 4 | 4 | 0 |
| Kafka E2E | 1 | 1 | 0 |
| **Total runtime** | **25** | **25** | **0** |

## Test Results

### Go Tests
```
ok  	github.com/samuellealdev/asset-tracker/go-service/cmd	0.038s
ok  	github.com/samuellealdev/asset-tracker/go-service/internal/application	0.022s
ok  	github.com/samuellealdev/asset-tracker/go-service/internal/domain	0.017s
--- SKIP: infrastructure (postgres integration tests — no local DB; K8s validates) ---
ok  	github.com/samuellealdev/asset-tracker/go-service/internal/interfaces	0.026s
```

### Node.js Tests
```
ℹ tests 62 / ℹ pass 62 / ℹ fail 0 / ℹ skipped 0
```
- 9 suites, 62 tests, 100% pass rate
- `go vet ./...` clean

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Per-route middleware inside DeviceHandler | Encapsulation; only infrastructure routes (/health, /metrics) remain public; follows existing LoggingMiddleware wrapping pattern |
| Closure factory `NewAuthMiddleware(secret)` | Immutable after construction; simple, no need for config struct |
| Typed context key `contextKey` | Prevents collisions per Go convention |
| `jwt.MapClaims` | Minimal for sub/exp/iat; no boilerplate needed |
| Credentials from env vars | 12-Factor App; demo scope (no DB user table) |
| `golang-jwt/jwt/v5` | Maintained fork of the standard Go JWT library |
| K8s Secret for credentials | JWT_SECRET, AUTH_USERNAME, AUTH_PASSWORD in Kubernetes Secret; 12-Factor compliance |
| K8s ConfigMap for non-secret config | JWT_EXPIRATION in ConfigMap; KAFKA_BROKER, KAFKA_TOPIC, PORT |

## SDD Cycle Complete

Phase 7 has been fully planned, implemented, verified, and archived. All acceptance criteria met including K8s deployment with 25 runtime tests passing.

### K8s Smoke Test Command (from k8s/README.md)
```bash
# After port-forward:
kubectl port-forward svc/go-service 8080:8080 -n asset-tracker &

# Login
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Authenticated device CRUD
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/devices
```
