# Tasks: Phase 1 — Go Hexagonal + PostgreSQL

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain+application) → PR 2 (infrastructure+interfaces+wiring) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Lines | Status |
|------|------|-------|--------|
| 1 | Domain entity + repository port + all use cases with tests | ~700 | ✅ Complete |
| 2 | PostgreSQL adapter + HTTP handler + wiring + E2E | ~950 | ✅ Complete |

## Phase 1: Domain Layer ✅

- [x] 1.1 `go-service/internal/domain/device.go` — Device entity, NewDevice factory, Update method
- [x] 1.2 `go-service/internal/domain/device_test.go` — Table-driven tests (8 subtests)

## Phase 2: Application Layer ✅

- [x] 2.1 `go-service/internal/application/repository.go` — DeviceRepository port (5 methods)
- [x] 2.2 `go-service/internal/application/errors.go` — ErrNotFound sentinel
- [x] 2.3 `go-service/internal/application/create_device.go` + test — CreateDeviceUseCase
- [x] 2.4 `go-service/internal/application/list_devices.go` + test — ListDevicesUseCase
- [x] 2.5 `go-service/internal/application/get_device.go` + test — GetDeviceUseCase
- [x] 2.6 `go-service/internal/application/update_device.go` + test — UpdateDeviceUseCase
- [x] 2.7 `go-service/internal/application/delete_device.go` + test — DeleteDeviceUseCase

## Phase 3: Infrastructure ✅

- [x] 3.1 `go-service/internal/infrastructure/migrations.go` — CREATE TABLE IF NOT EXISTS
- [x] 3.2 `go-service/internal/infrastructure/postgres_device_repository.go` — pgx adapter
- [x] 3.3 `go-service/internal/infrastructure/postgres_device_repository_test.go` — Integration tests

## Phase 4: Interfaces ✅

- [x] 4.1 `go-service/internal/interfaces/device_handler.go` — 5 HTTP handlers
- [x] 4.2 `go-service/internal/interfaces/device_handler_test.go` — httptest (17 subtests)
- [x] 4.3 `go-service/internal/interfaces/device_use_cases.go` — Use case composition

## Phase 5: Wiring ✅

- [x] 5.1 `go-service/cmd/main.go` — Manual DI, route registration, health endpoint
- [x] 5.2 `go-service/go.mod` — pgx/v5, google/uuid

## Phase 6: Verification ✅

- [x] 6.1 All 39 tests pass (domain, application, interfaces)
- [x] 6.2 All 14 acceptance criteria verified via curl
- [x] 6.3 Domain zero framework imports (grep check)
- [x] 6.4 docker compose up --build succeeds
