# Phase 5: Kubernetes Manifests

## Objective

Deploy the full Asset Tracker application to a local Kubernetes cluster using Kind or Minikube. Create production-ready manifests with Deployments, Services, ConfigMaps, Secrets, health probes, resource limits, and optional Ingress.

## Technical Requirements

- **Kubernetes manifests** organized in `k8s/` directory with subdirectories: `base/` (shared resources), `go-service/`, `node-service/`, `databases/`.
- **Namespace**: All resources deployed to `asset-tracker` namespace.
- **ConfigMap** (`asset-tracker-config`): Non-sensitive environment variables: `GO_PORT=8080`, `NODE_PORT=3000`, `NODE_URL=http://node-service:3000`, `LOG_LEVEL=info`, `POSTGRES_HOST=postgres`, `POSTGRES_DB=asset_tracker`, `MONGO_DB=asset_tracker`.
- **Secret** (`asset-tracker-secret`): Sensitive values: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MONGO_USER`, `MONGO_PASSWORD`. Values MUST be base64-encoded and marked as `type: Opaque`.
- **PostgreSQL**: Deployment with single replica, port 5432, persistent volume claim (1Gi), environment from ConfigMap + Secret. Service type ClusterIP. Liveness probe using `pg_isready`. Build from `postgres:16-alpine` image.
- **MongoDB**: Deployment with single replica, port 27017, persistent volume claim (1Gi), environment from Secret. Service type ClusterIP. Liveness probe using `mongosh --eval "db.adminCommand('ping')"`. Build from `mongo:7` image.
- **Go service**: Deployment with 2 replicas, port 8080. Container uses the multi-stage Docker image from Phase 0 (tagged and pushed to a local registry or loaded into Kind). Environment from ConfigMap + Secret. Liveness probe: `GET /health/live` (httpGet, path `/health/live`, port 8080). Readiness probe: `GET /health/ready`. Resource requests: CPU 100m, memory 128Mi. Limits: CPU 500m, memory 256Mi. Service type ClusterIP.
- **Node service**: Deployment with 2 replicas, port 3000. Same probe pattern with `/health/live` and `/health/ready`. Resource requests: CPU 100m, memory 128Mi. Limits: CPU 500m, memory 256Mi. Service type ClusterIP.
- **Ingress** (OPTIONAL): Single Ingress resource routing `/devices` to go-service and `/events` and `/health` to node-service. If implementing, use nginx-ingress controller (Kind supports this natively).
- **Testing with Kind**: Document step-by-step how to build images, load into Kind, and apply manifests.

## Files to Create

- `k8s/base/namespace.yaml` — Namespace: `asset-tracker`
- `k8s/base/configmap.yaml` — ConfigMap `asset-tracker-config` with all non-sensitive env vars
- `k8s/base/secret.yaml` — Secret `asset-tracker-secret` with template values (real values via `kubectl create secret` or sealed secrets)
- `k8s/databases/postgres-deployment.yaml` — PostgreSQL Deployment + PVC + Service
- `k8s/databases/postgres-pvc.yaml` — PersistentVolumeClaim 1Gi for PostgreSQL
- `k8s/databases/mongo-deployment.yaml` — MongoDB Deployment + PVC + Service
- `k8s/databases/mongo-pvc.yaml` — PersistentVolumeClaim 1Gi for MongoDB
- `k8s/go-service/deployment.yaml` — Go service Deployment with 2 replicas, probes, resources, env from ConfigMap and Secret
- `k8s/go-service/service.yaml` — Go service Service (ClusterIP, port 8080)
- `k8s/node-service/deployment.yaml` — Node service Deployment with 2 replicas, probes, resources, env from ConfigMap and Secret
- `k8s/node-service/service.yaml` — Node service Service (ClusterIP, port 3000)
- `k8s/ingress.yaml` — (OPTIONAL) Ingress resource with path-based routing
- `k8s/README.md` — Local Kind testing guide: build images, load into Kind, apply manifests, verify

## Files to Modify

- None — all files are new creations under `k8s/`.

## Acceptance Criteria

- [ ] `kubectl apply -f k8s/base/namespace.yaml` succeeds.
- [ ] `kubectl apply -f k8s/base/configmap.yaml -f k8s/base/secret.yaml` succeeds (after creating real secret values).
- [ ] `kubectl apply -f k8s/databases/` creates PostgreSQL and MongoDB Deployments, Services, and PVCs.
- [ ] `kubectl wait --for=condition=ready pod -l app=postgres -n asset-tracker --timeout=120s` succeeds.
- [ ] `kubectl wait --for=condition=ready pod -l app=mongo -n asset-tracker --timeout=120s` succeeds.
- [ ] `kubectl apply -f k8s/go-service/` creates go-service Deployment (2 replicas) and Service.
- [ ] `kubectl apply -f k8s/node-service/` creates node-service Deployment (2 replicas) and Service.
- [ ] `kubectl wait --for=condition=ready pod -l app=go-service -n asset-tracker --timeout=120s` — both replicas ready.
- [ ] `kubectl wait --for=condition=ready pod -l app=node-service -n asset-tracker --timeout=120s` — both replicas ready.
- [ ] `kubectl port-forward svc/go-service 8080:8080 -n asset-tracker` and `curl localhost:8080/health` returns 200.
- [ ] `kubectl port-forward svc/node-service 3000:3000 -n asset-tracker` and `curl localhost:3000/health` returns 200.
- [ ] Create a device via port-forwarded go-service: `POST /devices` returns 201.
- [ ] Event is created in Node service (verify via port-forwarded `GET /events` or `mongosh`).
- [ ] `kubectl describe pod -l app=go-service -n asset-tracker` shows liveness and readiness probes configured correctly.

## Constraints

- ALL manifests MUST use `apps/v1` API version for Deployments.
- Secrets MUST be `type: Opaque` with base64-encoded values. Document that real values MUST be provided via `kubectl create secret` or a secret management tool — the committed `secret.yaml` MUST contain placeholder values.
- Resource requests and limits MUST be specified for both Go and Node service containers.
- Liveness and readiness probes MUST use the `/health/live` and `/health/ready` endpoints implemented in Phase 4.
- DO NOT use Helm — manifests are plain YAML applied with `kubectl apply -f`.
- PersistentVolumeClaims MUST use the default StorageClass (Kind's standard storage class or Minikube's).
- Services MUST be ClusterIP type (internal only). Do NOT use NodePort or LoadBalancer unless specifically requested.

## Notes

- Load the `kubernetes-manifests` skill before writing manifests.
- For local Kind setup: `kind create cluster --name asset-tracker`.
- Build and load images into Kind: `docker build -t go-service:local go-service/ && kind load docker-image go-service:local --name asset-tracker` (repeat for node-service).
- Use `imagePullPolicy: IfNotPresent` or `Never` in Deployments when using locally loaded images.
- The `k8s/README.md` should include the exact commands needed to go from zero to running on Kind.
- If implementing Ingress, Kind requires: `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml`.
- For Minikube, use `minikube start --driver=docker` and `eval $(minikube docker-env)` before building images.
- PVCs of 1Gi are sufficient for demo purposes. In production, tune based on expected data volume.
- Do NOT deploy PostgreSQL or MongoDB with StatefulSets in this phase — simple Deployments with PVCs are sufficient for the demo scope.
