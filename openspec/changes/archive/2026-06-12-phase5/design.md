# Design: Phase 5 — Kubernetes Manifests

## Technical Approach

Deploy the full Asset Tracker stack to Kubernetes (Kind/Minikube) using plain YAML manifests organized in `k8s/`. Three database Deployments (PostgreSQL, MongoDB, Kafka KRaft) with PersistentVolumeClaims, and two application Deployments (go-service, node-service) with HTTP health probes and resource limits. All inter-service communication via ClusterIP Services and ConfigMap/Secret-backed environment variables.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Manifest layout | `k8s/{base,databases,go-service,node-service}/` | Groups by concern; `kubectl apply -f k8s/<dir>/` applies a subsystem atomically |
| Connection strings | `POSTGRES_DSN` and `MONGO_URI` as Secret keys (base64) | Services consume full DSNs, not individual host/user/password vars; avoids code changes |
| Image pull policy | `IfNotPresent` | Locally loaded images (Kind `load docker-image`) — no registry dependency |
| Kafka image | `bitnami/kafka:3.7` with `KAFKA_CFG_*` env prefix | Spec requirement; differs from docker-compose (`apache/kafka:3.9.2` with `KAFKA_*` prefix) |
| Kafka topic creation | Manual `kubectl exec` + `kafka-topics.sh --create` | Spec notes are authoritative; Go service has `AllowAutoTopicCreation:true` as fallback |
| PVC strategy | Deployments with PVCs, default StorageClass | Satisfies spec constraint; StatefulSets not required for demo scope |
| Kafka health probe | `kafka-topics.sh --bootstrap-server localhost:9092 --list` | Lightweight; validates broker is serving requests |

## Data Flow

```
[Ingress:80] ──→ go-service:8080 ──→ postgres:5432
                    │                    (ClusterIP)
                    │
              kafka-service:9092
                    │
             node-service:3000 ──→ mongo:27017
                                    (ClusterIP)
```

Kafka topic `device-events` created once via `kubectl exec` before application services start. Node consumer connects after Kafka liveness probe passes. Go producer auto-creates the topic as fallback (`AllowAutoTopicCreation:true`).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `k8s/base/namespace.yaml` | Create | `asset-tracker` namespace |
| `k8s/base/configmap.yaml` | Create | Non-sensitive: `PORT`, `KAFKA_BROKER`, `KAFKA_TOPIC`, `KAFKA_CONSUMER_GROUP`, `LOG_LEVEL` |
| `k8s/base/secret.yaml` | Create | Base64 Opaque: `POSTGRES_DSN`, `MONGO_URI`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MONGO_USER`, `MONGO_PASSWORD` |
| `k8s/databases/postgres-deployment.yaml` | Create | PostgreSQL Deployment + ClusterIP Service (port 5432), `pg_isready` probe |
| `k8s/databases/postgres-pvc.yaml` | Create | 1Gi PVC for `/var/lib/postgresql/data` |
| `k8s/databases/mongo-deployment.yaml` | Create | MongoDB Deployment + ClusterIP Service (port 27017), `mongosh --eval ping` probe |
| `k8s/databases/mongo-pvc.yaml` | Create | 1Gi PVC for `/data/db` |
| `k8s/databases/kafka-deployment.yaml` | Create | Kafka KRaft Deployment (single broker, controller+broker role) + 1Gi PVC |
| `k8s/databases/kafka-service.yaml` | Create | Kafka ClusterIP Service (port 9092, name `kafka-service`) |
| `k8s/go-service/deployment.yaml` | Create | 2 replicas, HTTP probes `/health/live` + `/health/ready`, resources 100m/128Mi req / 500m/256Mi limit |
| `k8s/go-service/service.yaml` | Create | ClusterIP Service (port 8080) |
| `k8s/node-service/deployment.yaml` | Create | 2 replicas, same probe pattern + resource profile, Kafka consumer group env |
| `k8s/node-service/service.yaml` | Create | ClusterIP Service (port 3000) |
| `k8s/ingress.yaml` | Create (optional) | Ingress with path routing `/devices`→go, `/health`→node; requires nginx-ingress on Kind |
| `k8s/README.md` | Create | Step-by-step: kind cluster, image build+load, apply, topic creation, verification |

## Interfaces / Contracts

### Env var consumption per service

| Service | Required env vars |
|---------|-------------------|
| Go | `PORT`(8080), `POSTGRES_DSN`, `KAFKA_BROKER`, `KAFKA_TOPIC` |
| Node | `PORT`(3000), `MONGO_URI`, `KAFKA_BROKER`, `KAFKA_TOPIC`, `KAFKA_CONSUMER_GROUP`, `LOG_LEVEL` |

### Health probe contracts

```
GET /health/live  → 200 {"status":"ok"}                          (liveness)
GET /health/ready → 200 {"status":"ok","database":"connected"}   (readiness; 503 if DB down)
```

Both services implement identical contracts. K8s probes: `httpGet` on these paths. PostgreSQL uses `pg_isready -U $POSTGRES_USER` (exec probe). MongoDB uses `mongosh --eval "db.adminCommand('ping')"` (exec probe).

### Resource budgets

| Container | CPU req/limit | Memory req/limit |
|-----------|---------------|-------------------|
| go-service | 100m/500m | 128Mi/256Mi |
| node-service | 100m/500m | 128Mi/256Mi |
| postgres | 200m/500m | 256Mi/512Mi |
| mongo | 200m/500m | 256Mi/512Mi |
| kafka | 300m/1000m | 512Mi/1Gi |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manifest validity | YAML syntax, API versions | `kubectl apply --dry-run=client -f k8s/` |
| Pod readiness | All 5 deployments reach Ready | `kubectl wait --for=condition=ready --timeout=120s` per deployment |
| Integration | POST device → Kafka event → MongoDB | `kubectl port-forward` + curl + `mongosh` |
| Probes | Liveness/readiness configuration | `kubectl describe pod` shows probe paths; verify 200 responses |

## Migration / Rollout

No migration required — Phase 5 is net-new infrastructure. Rollback: `kubectl delete -f k8s/` removes all resources. PVC data survives `kubectl delete` unless PVCs explicitly deleted.

## Architectural Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **ENV mismatch**: Spec defines individual vars (`POSTGRES_HOST`) but services consume connection strings (`POSTGRES_DSN`). ConfigMap must supply what services actually read. | Medium | Secret stores `POSTGRES_DSN`/`MONGO_URI` directly; ConfigMap holds additional non-sensitive vars. No code change needed. |
| **Ingress health routing**: Both services expose `/health`. Spec routes `/health` to node-service only; go-service health unreachable via Ingress. | Low | Acceptable for demo. Document limitation in README. |
| **Kafka image drift**: Docker Compose (`apache/kafka:3.9.2`) vs K8s (`bitnami/kafka:3.7`). Different env var prefixes, binary paths. | Low | Follow spec precisely. Binary path: `/opt/bitnami/kafka/bin/`. No runtime impact since services communicate via standard Kafka protocol. |
| **PVC data loss**: Default reclaim policy `Delete` means PVC deletion removes data. | Low | Acceptable for demo. README documents `kubectl delete pvc` behavior. |
| **Kafka topic race**: Manual topic creation required before services start. Go service auto-creates as fallback but may cause momentary errors. | Low | README documents topic creation as first post-deploy step; Go service `AllowAutoTopicCreation:true` handles race gracefully. |
