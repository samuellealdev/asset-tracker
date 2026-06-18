# ADR 005: Kafka Single-Node — Accepted for Development

## Status

Accepted (single-node for development, multi-node for production)

## Context

The `docker-compose.yml` configures a single Kafka broker with `replication.factor: 1`. This is a single point of failure. In production, a typical cluster has 3+ brokers with `replication.factor: 3`.

## Decision

**Use a single Kafka broker for local development. Document the expected production architecture.**

## Alternatives Considered

1. **3-broker cluster in Docker Compose**: Would consume ~3GB additional RAM. Unfeasible for local development.
2. **3-broker cluster in Kubernetes (StatefulSet)**: Feasible in production, but current manifests target Kind/Docker Desktop.
3. **Single-node (current state)**: Correct for development. KRaft mode allows single node as broker + controller.

## Consequences

- In local dev: Kafka failure means event loss (acceptable for development)
- In production: 3 brokers, `replication.factor: 3`, `min.insync.replicas: 2`, StatefulSet with PersistentVolumes

## References

- [Kafka KRaft Overview](https://developer.confluent.io/learn/kraft/)
