# ADR 002: Outbox Pattern — Deferred

## Status

Deferred (not implemented in MVP)

## Context

Currently, when a device is created, the flow is: (1) INSERT into PostgreSQL, (2) goroutine publishes event to Kafka. If step 2 fails, the device is already persisted but the event is **lost forever**. The device and event databases become inconsistent.

## Decision

**Do not implement the Outbox Pattern in this phase.** The project accepts event loss as a simplicity trade-off.

## Alternatives Considered

1. **Full Outbox Pattern**: An `outbox` table in PostgreSQL with an async publishing worker. Guarantees atomicity.
2. **Do nothing (current state)**: Acceptable for a demo. Core business (device CRUD) is unaffected.
3. **Simple retry in the goroutine**: Would mitigate transient errors but not prolonged Kafka outages.

## Consequences

- System events may be lost if Kafka is unavailable
- In production, the Outbox Pattern would be implemented with an `outbox` table and a polling worker
- This decision is conscious and documented — it is not an oversight

## References

- [Outbox Pattern (Microservices.io)](https://microservices.io/patterns/data/transactional-outbox.html)
