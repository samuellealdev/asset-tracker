# ADR 001: Circuit Breaker — Deferred

## Status

Deferred (not implemented in MVP)

## Context

The Go service publishes events to Kafka asynchronously via goroutines using `context.Background()`. When Kafka is unavailable, every `POST /devices` request attempts to connect, fails, and logs an error. This causes log saturation, unnecessary resource consumption, and added latency.

## Decision

**Do not implement a circuit breaker in this phase.** The current system logs the error and continues — device creation is not blocked.

## Alternatives Considered

1. **gobreaker (Go library)**: Correct implementation but requires changing the event publishing flow in all 3 use cases.
2. **Manual implementation**: Unnecessary complexity for a demo project.
3. **Do nothing (current state)**: Acceptable for the project scope.

## Consequences

- Events are lost if Kafka is down (error is logged, device is still created)
- In production, this would be implemented with `gobreaker` (3 consecutive failures → circuit opens for 30s → half-open with 1 probe request)
- The Outbox Pattern (ADR 002) would complement this decision by ensuring events are never lost

## References

- [gobreaker](https://github.com/sony/gobreaker)
- [Circuit Breaker Pattern (Martin Fowler)](https://martinfowler.com/bliki/CircuitBreaker.html)
