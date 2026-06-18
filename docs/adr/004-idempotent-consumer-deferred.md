# ADR 004: Idempotent Kafka Consumer — Deferred

## Status

Deferred (not implemented in MVP)

## Context

Kafka guarantees **at-least-once** delivery. If the Node consumer processes an event, saves it to MongoDB, but fails to commit the offset, Kafka will re-deliver the same message, creating a duplicate event. The consumer has no idempotency mechanism.

## Decision

**Do not implement idempotency in this phase.** The project accepts the possibility of duplicates as a simplicity trade-off.

## Alternatives Considered

1. **Idempotency key via `$setOnInsert`**: Use `topic:partition:offset` as MongoDB `_id`. Atomic upsert, ~10 lines of code.
2. **Separate `processed_messages` collection**: Adds one extra operation per message.
3. **Do nothing (current state)**: Acceptable for a demo.

## Consequences

- Theoretical possibility of duplicate events if Kafka re-delivers messages
- In production: `$setOnInsert` with `topic:partition:offset` as idempotency key

## References

- [Kafka Exactly-Once Semantics](https://docs.confluent.io/platform/current/streams/concepts.html)
