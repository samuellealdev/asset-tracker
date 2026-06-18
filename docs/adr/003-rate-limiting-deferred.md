# ADR 003: Rate Limiting — Deferred

## Status

Deferred (not implemented in MVP)

## Context

None of the Go service endpoints have request rate limits. A malicious client, or a frontend bug, could overwhelm the service with thousands of requests per second.

## Decision

**Do not implement rate limiting in this phase.** The project is an architecture demo, not a system exposed to real traffic.

## Alternatives Considered

1. **Token Bucket (golang.org/x/time/rate)**: Trivial (~20 lines). Rejects with HTTP 429 when exceeded.
2. **External API Gateway**: Overkill for a demo.
3. **Do nothing (current state)**: Acceptable for the project scope.

## Consequences

- No protection against abuse or infinite-loop bugs in clients
- In production: `golang.org/x/time/rate` with 100 req/s, burst 200, `Retry-After` header

## References

- [Rate Limiting (golang.org/x/time/rate)](https://pkg.go.dev/golang.org/x/time/rate)
