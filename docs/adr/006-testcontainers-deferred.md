# ADR 006: Testcontainers — Deferred

## Status

Deferred (not implemented in MVP)

## Context

Infrastructure tests use `t.Skip` when environment variables are not set. Locally, `go test` passes green without a running database (false confidence). Integration tests only run in CI.

## Decision

**Do not implement Testcontainers in this phase.** Maintain `t.Skip` for local dev and rely on CI services.

## Alternatives Considered

1. **Testcontainers**: Spins up real containers inside tests. Zero config, always executable. But adds Docker dependency and ~10-15s overhead.
2. **In-memory databases**: Faster but does not test the real driver.
3. **`t.Skip` (current state)**: Simple, fast locally, guaranteed in CI.

## Consequences

- Locally, infrastructure tests are skipped without databases
- In CI, integration tests run against real PostgreSQL and MongoDB
- This decision is conscious and documented

## References

- [Testcontainers for Go](https://golang.testcontainers.org/)
