# Phase 5: Kubernetes Manifests

## Objective

Deploy the full Asset Tracker application to a local Kubernetes cluster using Kind or Minikube. Create production-ready manifests with Deployments, Services, ConfigMaps, Secrets, health probes, resource limits, and optional Ingress. Includes Kafka in KRaft mode for event-driven inter-service communication.

## Technical Requirements

- **Kubernetes manifests** organized in `k8s/` directory with subdirectories: `base/` (shared resources), `go-service/`, `node-service/`, `databases/`.
- **Namespace**: All resources deployed to `asset-tracker` namespace.
- **ConfigMap** (`asset-tracker-config`): Non-sensitive environment variables: `GO_PORT=8080`, `NODE_PORT=3000`, `LOG_LEVEL=info`, `POSTGRES_HOST=postgres`, `POSTGRES_DB=asset_tracker`, `MONGO_DB=asset_tracker`, `KAFKA_BROKER=kafka-service:9092`, `KAFKA_TOPIC=device-events`, `KAFKA_CONSUMER_GROUP=asset-tracker-node`.
- **Secret** (`asset-tracker-secret`): Sensitive values: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MONGO_USER`, `MONGO_PASSWORD`. Values MUST be base64-encoded and marked as `type: Opaque`.
- **PostgreSQL**: Deployment with single replica, port 5432, persistent volume claim (1Gi), environment from ConfigMap + Secret. Service type ClusterIP. Liveness probe using `pg_isready`. Build from `postgres:16-alpine` image.
- **MongoDB**: Deployment with single replica, port 27017, persistent volume claim (1Gi), environment from Secret. Service type ClusterIP. Liveness probe using `mongosh --eval "db.adminCommand('ping')"`. Build from `mongo:7` image.
- **Kafka**: Deployment with single replica, port 9092, persistent volume claim (1Gi — optional, ephemeral storage acceptable for demo). KRaft mode (no Zookeeper) via environment variables: `KAFKA_CFG_PROCESS_ROLES=broker,controller`, `KAFKA_CFG_NODE_ID=1`, `KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@localhost:9093`, `KAFKA_CFG_LISTENERS=PLAINTEXT://:9092`, `KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-service:9092`, `KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT`, `KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=1`. Service type ClusterIP on port 9092. Liveness probe using `kafka-topics.sh --bootstrap-server localhost:9092 --list`. Image: `bitnami/kafka:3.7`.
- **Go service**: Deployment with 2 replicas, port 8080. Container uses the multi-stage Docker image from Phase 0 (tagged and pushed to a local registry or loaded into Kind). Environment from ConfigMap + Secret. Liveness probe: `GET /health/live` (httpGet, path `/health/live`, port 8080). Readiness probe: `GET /health/ready`. Resource requests: CPU 100m, memory 128Mi. Limits: CPU 500m, memory 256Mi. Service type ClusterIP.
- **Node service**: Deployment with 2 replicas, port 3000. Same probe pattern with `/health/live` and `/health/ready`. Resource requests: CPU 100m, memory 128Mi. Limits: CPU 500m, memory 256Mi. Service type ClusterIP.
- **Ingress** (OPTIONAL): Single Ingress resource routing `/devices` to go-service and `/health` to node-service. If implementing, use nginx-ingress controller (Kind supports this natively).
- **Testing with Kind**: Document step-by-step how to build images, load into Kind, create Kafka topic, and apply manifests.

## Files to Create

- `k8s/base/namespace.yaml` — Namespace: `asset-tracker`
- `k8s/base/configmap.yaml` — ConfigMap `asset-tracker-config` with all non-sensitive env vars (including `KAFKA_BROKER`, `KAFKA_TOPIC`, `KAFKA_CONSUMER_GROUP`; no `NODE_URL`)
- `k8s/base/secret.yaml` — Secret `asset-tracker-secret` with template values (real values via `kubectl create secret` or sealed secrets)
- `k8s/databases/postgres-deployment.yaml` — PostgreSQL Deployment + PVC + Service
- `k8s/databases/postgres-pvc.yaml` — PersistentVolumeClaim 1Gi for PostgreSQL
- `k8s/databases/mongo-deployment.yaml` — MongoDB Deployment + PVC + Service
- `k8s/databases/mongo-pvc.yaml` — PersistentVolumeClaim 1Gi for MongoDB
- `k8s/databases/kafka-deployment.yaml` — Kafka Deployment in KRaft mode, PVC (1Gi), Service, health probes
- `k8s/databases/kafka-service.yaml` — Kafka Service (ClusterIP, port 9092)
- `k8s/go-service/deployment.yaml` — Go service Deployment with 2 replicas, probes, resources, env from ConfigMap and Secret
- `k8s/go-service/service.yaml` — Go service Service (ClusterIP, port 8080)
- `k8s/node-service/deployment.yaml` — Node service Deployment with 2 replicas, probes, resources, env from ConfigMap and Secret
- `k8s/node-service/service.yaml` — Node service Service (ClusterIP, port 3000)
- `k8s/ingress.yaml` — (OPTIONAL) Ingress resource with path-based routing
- `k8s/README.md` — Local Kind testing guide: build images, load into Kind, create Kafka topic, apply manifests, verify

## Files to Modify

- None — all files are new creations under `k8s/`. However, note that the ConfigMap and go-service/node-service Deployments MUST use Kafka environment variables instead of the previous HTTP-based `NODE_URL`.

## Acceptance Criteria

- [ ] `kubectl apply -f k8s/base/namespace.yaml` succeeds.
- [ ] `kubectl apply -f k8s/base/configmap.yaml -f k8s/base/secret.yaml` succeeds (after creating real secret values).
- [ ] `kubectl apply -f k8s/databases/` creates PostgreSQL, MongoDB, and Kafka Deployments, Services, and PVCs.
- [ ] `kubectl wait --for=condition=ready pod -l app=postgres -n asset-tracker --timeout=120s` succeeds.
- [ ] `kubectl wait --for=condition=ready pod -l app=mongo -n asset-tracker --timeout=120s` succeeds.
- [ ] `kubectl wait --for=condition=ready pod -l app=kafka -n asset-tracker --timeout=120s` succeeds.
- [ ] `kubectl exec -n asset-tracker deploy/kafka -- /opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` executes successfully (exit 0).
- [ ] `kubectl exec -n asset-tracker deploy/kafka -- /opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic device-events --if-not-exists` creates the topic (idempotent).
- [ ] `kubectl apply -f k8s/go-service/` creates go-service Deployment (2 replicas) and Service.
- [ ] `kubectl apply -f k8s/node-service/` creates node-service Deployment (2 replicas) and Service.
- [ ] `kubectl wait --for=condition=ready pod -l app=go-service -n asset-tracker --timeout=120s` — both replicas ready.
- [ ] `kubectl wait --for=condition=ready pod -l app=node-service -n asset-tracker --timeout=120s` — both replicas ready.
- [ ] `kubectl port-forward svc/go-service 8080:8080 -n asset-tracker` and `curl localhost:8080/health` returns 200.
- [ ] `kubectl port-forward svc/node-service 3000:3000 -n asset-tracker` and `curl localhost:3000/health` returns 200.
- [ ] Create a device via port-forwarded go-service: `POST /devices` returns 201.
- [ ] Event is consumed by Node service and stored in MongoDB (verify via port-forwarded MongoDB or `mongosh`).
- [ ] `kubectl describe pod -l app=go-service -n asset-tracker` shows liveness and readiness probes configured correctly.
- [ ] `kubectl describe pod -l app=kafka -n asset-tracker` shows Kafka running in KRaft mode with correct env vars.

## Constraints

- ALL manifests MUST use `apps/v1` API version for Deployments.
- Secrets MUST be `type: Opaque` with base64-encoded values. Document that real values MUST be provided via `kubectl create secret` or a secret management tool — the committed `secret.yaml` MUST contain placeholder values.
- Resource requests and limits MUST be specified for both Go and Node service containers.
- Liveness and readiness probes MUST use the `/health/live` and `/health/ready` endpoints implemented in Phase 4.
- DO NOT use Helm — manifests are plain YAML applied with `kubectl apply -f`.
- PersistentVolumeClaims MUST use the default StorageClass (Kind's standard storage class or Minikube's).
- Services MUST be ClusterIP type (internal only). Do NOT use NodePort or LoadBalancer unless specifically requested.
- Kafka MUST run in KRaft mode (no Zookeeper StatefulSet or Deployment). Use bitnami/kafka:3.7 image.
- Kafka Service MUST be reachable within the cluster as `kafka-service:9092`.
- The `device-events` Kafka topic MUST be created before Go and Node services start (or the services MUST handle missing-topic errors gracefully). Document the topic creation command in `k8s/README.md`.

## Notes

- Load the `kubernetes-manifests` skill before writing manifests.
- For local Kind setup: `kind create cluster --name asset-tracker`.
- Build and load images into Kind: `docker build -t go-service:local go-service/ && kind load docker-image go-service:local --name asset-tracker` (repeat for node-service).
- Use `imagePullPolicy: IfNotPresent` or `Never` in Deployments when using locally loaded images.
- The `k8s/README.md` should include the exact commands needed to go from zero to running on Kind, including Kafka topic creation.
- If implementing Ingress, Kind requires: `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml`.
- For Minikube, use `minikube start --driver=docker` and `eval $(minikube docker-env)` before building images.
- PVCs of 1Gi are sufficient for demo purposes. In production, tune based on expected data volume.
- Kafka KRaft mode: the bitnami/kafka image handles the combined broker+controller role. A single `KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@localhost:9093` is sufficient for a single-node deployment.
- Do NOT deploy PostgreSQL, MongoDB, or Kafka with StatefulSets in this phase — simple Deployments with PVCs are sufficient for the demo scope.
- Kafka topic creation is manual for this phase: use `kubectl exec` to create the `device-events` topic after Kafka is running. The `k8s/README.md` MUST document this step.
