# Tasks: Phase 5 — Kubernetes Manifests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~677 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation+databases) → PR 2 (app services+ingress) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Status |
|------|------|--------|
| 1 | Foundation + databases: namespace, ConfigMap, Secret, PostgreSQL, MongoDB, Kafka + README | ✅ Complete |
| 2 | App services + Ingress: go-service, node-service, Ingress | ✅ Complete |

## Phase 1: Shared Foundation ✅

- [x] 1.1 `k8s/namespace.yaml` — Namespace `asset-tracker`
- [x] 1.2 `k8s/configmap.yaml` — ConfigMap with ports, Kafka, DB names
- [x] 1.3 `k8s/secret.yaml` — Secret with POSTGRES_DSN, MONGO_URI, JWT_SECRET

## Phase 2: Databases ✅

- [x] 2.1 `k8s/postgres-deployment.yaml` — PVC + Deployment + Service
- [x] 2.2 `k8s/mongo-deployment.yaml` — PVC + Deployment + Service
- [x] 2.3 `k8s/kafka-deployment.yaml` — PVC + Deployment (KRaft) + Service
- [x] 2.4 `k8s/kafka-create-topics-job.yaml` — Job that waits for Kafka, creates device-events topic (post-archive)

## Phase 3: Application Services ✅

- [x] 3.1 `k8s/go-service-deployment.yaml` — Deployment + Service, probes, resources
- [x] 3.2 `k8s/node-service-deployment.yaml` — Deployment + Service, probes, resources

## Phase 4: Ingress + Documentation ✅

- [x] 4.1 `k8s/ingress.yaml` — nginx Ingress with /go/* and /node/* routing
- [x] 4.2 `k8s/README.md` — Kind/Minikube setup, apply order, port-forward, smoke test

## Phase 5: Verification ✅

- [x] 5.1 All YAML manifests syntactically valid
- [x] 5.2 All Deployments have probes + resource limits
- [x] 5.3 All Services are ClusterIP
- [x] 5.4 Ingress routes correctly configured
