# Asset Tracker — Kubernetes Deployment Guide

## Prerequisites

- [Kind](https://kind.sigs.k8s.io/) (local Kubernetes) or [Minikube](https://minikube.sigs.k8s.io/)
- `kubectl` installed and configured
- Docker images built locally (see Build & Load below)

---

## Local Cluster Setup

### Option A: Kind

```bash
# Create cluster
kind create cluster --name asset-tracker

# Verify
kubectl cluster-info --context kind-asset-tracker
```

### Option B: Minikube

```bash
# Start cluster
minikube start --driver=docker

# Use Minikube's Docker daemon for image builds
eval $(minikube docker-env)
```

---

## Build & Load Docker Images

Build the service images before applying manifests:

```bash
# From the repository root
docker build -t asset-tracker-go-service:latest ./go-service
docker build -t asset-tracker-node-service:latest ./node-service
docker build -t asset-tracker-web-ui:latest ./web-ui
```

Load images into Kind (skip for Minikube if using `minikube docker-env`):

```bash
kind load docker-image asset-tracker-go-service:latest --name asset-tracker
kind load docker-image asset-tracker-node-service:latest --name asset-tracker
kind load docker-image asset-tracker-web-ui:latest --name asset-tracker
```

---

## Apply Manifests

Apply all resources in the correct dependency order:

```bash
# 1. Namespace first
kubectl apply -f k8s/namespace.yaml

# 2. ConfigMap and Secret (no ordering dependency)
kubectl apply -f k8s/configmap.yaml -f k8s/secret.yaml

# 3. Databases (PostgreSQL, MongoDB, Kafka)
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/kafka-deployment.yaml

# 4. Verify database pods are ready
kubectl wait --for=condition=ready pod -l app=postgres -n asset-tracker --timeout=120s
kubectl wait --for=condition=ready pod -l app=mongo -n asset-tracker --timeout=120s
kubectl wait --for=condition=ready pod -l app=kafka -n asset-tracker --timeout=120s

# 5. Create Kafka topics (runs once, waits for Kafka to be ready)
kubectl apply -f k8s/kafka-create-topics-job.yaml
kubectl wait --for=condition=complete job/kafka-create-topics -n asset-tracker --timeout=120s

# 6. Application services
kubectl apply -f k8s/go-service-deployment.yaml
kubectl apply -f k8s/node-service-deployment.yaml
kubectl apply -f k8s/web-ui-deployment.yaml
kubectl apply -f k8s/web-ui-service.yaml

# 7. Verify application pods are ready
kubectl wait --for=condition=ready pod -l app=go-service -n asset-tracker --timeout=120s
kubectl wait --for=condition=ready pod -l app=node-service -n asset-tracker --timeout=120s
kubectl wait --for=condition=ready pod -l app=web-ui -n asset-tracker --timeout=120s

# 8. (Optional) Ingress — requires nginx-ingress installed first (see Ingress Setup below)
# kubectl apply -f k8s/ingress.yaml
```

Or apply everything at once (may cause transient errors as pods start):

```bash
kubectl apply -f k8s/
```

---

## Kafka Topic Creation

The `device-events` topic is created automatically by a dedicated Kubernetes Job (`kafka-create-topics-job.yaml`) that runs after Kafka is ready but before application services start. The Job waits for the broker, creates the topic with `--if-not-exists`, and exits. No manual intervention needed.

For troubleshooting, you can also create it manually:

```bash
kubectl exec -n asset-tracker deploy/kafka -- \
  /opt/kafka/bin/kafka-topics.sh \
    --create \
    --topic device-events \
    --partitions 1 \
    --replication-factor 1 \
    --if-not-exists \
    --bootstrap-server localhost:9092
```

Verify the topic exists:

```bash
kubectl exec -n asset-tracker deploy/kafka -- \
  /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --list
```

---

## Port-Forwarding for Local Access

```bash
# PostgreSQL (port 5432)
kubectl port-forward svc/postgres-service 5432:5432 -n asset-tracker

# MongoDB (port 27017)
kubectl port-forward svc/mongo-service 27017:27017 -n asset-tracker

# Kafka (port 9092)
kubectl port-forward svc/kafka-service 9092:9092 -n asset-tracker

# Go service (port 8080) — after Phase 5 services are deployed
kubectl port-forward svc/go-service 8080:8080 -n asset-tracker

# Node service (port 3000) — after Phase 5 services are deployed
kubectl port-forward svc/node-service 3000:3000 -n asset-tracker

# Web UI (port 80) — after Phase 6 services are deployed
kubectl port-forward svc/web-ui 80:80 -n asset-tracker
```

---

## Ingress Setup (Optional)

The Ingress resource (`k8s/ingress.yaml`) routes external HTTP traffic to the application services:

| Path | Backend Service | Notes |
|------|----------------|-------|
| `/` | web-ui:80 | Frontend SPA — all routes serve index.html |
| `/devices` | go-service:8080 | Device CRUD |
| `/events` | node-service:3000 | Event logging |
| `/go/health` | go-service:8080 | → rewritten to `/health` |
| `/go/metrics` | go-service:8080 | → rewritten to `/metrics` |
| `/node/health` | node-service:3000 | → rewritten to `/health` |
| `/node/metrics` | node-service:3000 | → rewritten to `/metrics` |

The `/go/*` and `/node/*` prefixes use nginx `rewrite-target` to strip the prefix before forwarding.
Both services' health and metrics endpoints are now accessible via Ingress.
### Install nginx-ingress on Kind

Kind does not ship with an Ingress Controller. Install nginx-ingress:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Wait for the controller to be ready:

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### Apply the Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### Test via Ingress

With port-forwarding to the nginx-ingress controller (Kind exposes it on `localhost:80` by default):

```bash
# Port-forward nginx-ingress (run in a separate terminal)
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8081:80

# Test device endpoint
curl http://localhost:8081/devices

# Test events endpoint
curl http://localhost:8081/events

# Test health and metrics (both services)
curl http://localhost:8081/go/health
curl http://localhost:8081/go/health/live
curl http://localhost:8081/go/metrics
curl http://localhost:8081/node/health
curl http://localhost:8081/node/metrics
```

---

## E2E Smoke Test

After all services are running:

```bash
# 1. Health check Go service (public endpoints — no auth required)
kubectl port-forward svc/go-service 8080:8080 -n asset-tracker &
curl http://localhost:8080/health/live
curl http://localhost:8080/health/ready

# 2. Health check Node service
kubectl port-forward svc/node-service 3000:3000 -n asset-tracker &
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready

# 3. Verify protected endpoints require authentication
curl -X POST http://localhost:8080/devices \
  -H "Content-Type: application/json" \
  -d '{"name":"test-device","type":"laptop"}' -w "\nHTTP %{http_code}\n"
# Expected: 401 Unauthorized

curl http://localhost:8080/devices -w "\nHTTP %{http_code}\n"
# Expected: 401 Unauthorized

# 4. Login and obtain JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')
echo "JWT token: ${TOKEN:0:20}..."

# 5. List devices with auth (should be empty initially)
curl -s http://localhost:8080/devices \
  -H "Authorization: Bearer $TOKEN" | jq .
# Expected: 200 with empty array []

# 6. Create a device with auth
curl -s -X POST http://localhost:8080/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"test-device","type":"laptop"}' | jq .
# Expected: 201 with device JSON

# 7. List devices with auth (should show created device)
curl -s http://localhost:8080/devices \
  -H "Authorization: Bearer $TOKEN" | jq .
# Expected: 200 with array containing test-device

# 8. Update the device with auth
DEVICE_ID=$(curl -s http://localhost:8080/devices \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
curl -s -X PUT "http://localhost:8080/devices/$DEVICE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"test-device-updated","type":"desktop"}' | jq .
# Expected: 200 with updated device JSON

# 9. Delete the device with auth
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X DELETE "http://localhost:8080/devices/$DEVICE_ID" \
  -H "Authorization: Bearer $TOKEN"
# Expected: HTTP 204

# 10. Verify PUT and DELETE require auth (unauthorized attempts)
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X PUT "http://localhost:8080/devices/$DEVICE_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"x","type":"y"}'
# Expected: HTTP 401

curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X DELETE "http://localhost:8080/devices/$DEVICE_ID"
# Expected: HTTP 401

# 11. Verify Kafka topic has messages
kubectl exec -n asset-tracker deploy/kafka -- \
  /opt/kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic device-events \
    --from-beginning \
    --max-messages 1 \
    --timeout-ms 5000

# 12. Verify MongoDB has the event (Kafka E2E pipeline)
kubectl exec -n asset-tracker deploy/mongo -- \
  mongosh --quiet \
    -u mongo -p changeme \
    --authenticationDatabase admin \
    asset_tracker \
    --eval "db.device_events.find().pretty()"

# 13. Verify /metrics still works (public endpoint, no auth required)
curl http://localhost:8080/metrics
```

### Smoke Test Without jq

If `jq` is not available, replace step 4 with:

```bash
# Login and manually extract token
curl -v -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' 2>&1 | grep '"token"'
# Copy the token value and use it in subsequent curl commands:
# curl -H "Authorization: Bearer <paste-token-here>" http://localhost:8080/devices
```

---

## Verify Probes

```bash
kubectl describe pod -l app=postgres -n asset-tracker | grep -A5 -i probe
kubectl describe pod -l app=mongo -n asset-tracker | grep -A5 -i probe
kubectl describe pod -l app=kafka -n asset-tracker | grep -A5 -i probe
kubectl describe pod -l app=go-service -n asset-tracker | grep -A5 -i probe
kubectl describe pod -l app=node-service -n asset-tracker | grep -A5 -i probe
```

---

## Clean Up

```bash
# Delete all resources in the namespace
kubectl delete namespace asset-tracker

# Or delete specific resources to preserve PVC data
kubectl delete -f k8s/

# Delete Kind cluster
kind delete cluster --name asset-tracker

# Delete Minikube cluster
minikube delete
```

> **Note**: PVCs with `Delete` reclaim policy will remove data when PVCs are deleted.
> To preserve database data between deployments, do not delete PVCs manually.

---

## Verification Checklist (Tested)

All services were successfully deployed and verified on a Kind cluster:

| Service | Health | Seed Data | Notes |
|---------|--------|-----------|-------|
| Postgres | ✅ | ✅ | pg_isready probe works |
| MongoDB | ✅ | ✅ | mongosh ping probe works |
| Kafka | ✅ | ✅ | Topic auto-created by Job |
| Go Service | ✅ | ✅ | /health, /health/live, /health/ready |
| Node Service | ✅ | ✅ | /health, events query |
| Web UI | ✅ | ✅ | SPA served via nginx |
| Ingress (nginx) | ✅ | N/A | /go/health, /node/health rewrites |

**Seed script**: `GO_PORT=8082 NODE_PORT=3001 ./seed.sh` (adjust ports when using port-forward with non-default ports)

**Ingress routes** (with nginx-ingress controller on Kind):
- `localhost/devices` → Go service (requires auth)
- `localhost/events` → Node service (requires deviceId or type param)
- `/go/health` → rewritten to Go `/health`
- `/node/health` → rewritten to Node `/health`

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Pod `Init:CrashLoopBackOff` | Missing images not loaded into cluster | Run `kind load docker-image ...` first |
| Kafka pod not ready | Insufficient resources (memory) | Increase Docker memory limit, or reduce Kafka resource requests |
| `pg_isready` fails | PostgreSQL still initializing | Wait, or increase `initialDelaySeconds` |
| Topic already exists error | Topic created twice | Use `--if-not-exists` flag (already included in the Job command) |
| ImagePullBackOff | Image not found | Ensure images are built and loaded into the cluster |
| Port-forward "address already in use" | Local port already occupied | Use a different port: `kubectl port-forward svc/go-service 8082:8080` |
| Ingress returns 404 | nginx-ingress controller not installed | Run `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml` |
| Node service events endpoint returns 400 | Missing required params | Add `?type=maintenance` or `?deviceId=<id>` query parameters |
