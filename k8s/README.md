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
docker build -t go-service:local ./go-service
docker build -t node-service:local ./node-service
```

Load images into Kind (skip for Minikube if using `minikube docker-env`):

```bash
kind load docker-image go-service:local --name asset-tracker
kind load docker-image node-service:local --name asset-tracker
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

# 5. (Future) Application services
# kubectl apply -f k8s/go-service/
# kubectl apply -f k8s/node-service/
```

Or apply everything at once (may cause transient errors as pods start):

```bash
kubectl apply -f k8s/
```

---

## Kafka Topic Creation

The `device-events` topic is auto-created via a `postStart` lifecycle hook on the Kafka container. You can also create it manually if needed:

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
```

---

## E2E Smoke Test

After all services are running:

```bash
# 1. Health check Go service
kubectl port-forward svc/go-service 8080:8080 -n asset-tracker &
curl http://localhost:8080/health/live
curl http://localhost:8080/health/ready

# 2. Health check Node service
kubectl port-forward svc/node-service 3000:3000 -n asset-tracker &
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready

# 3. Create a device (requires running Go service)
curl -X POST http://localhost:8080/devices \
  -H "Content-Type: application/json" \
  -d '{"name":"test-device","type":"laptop","location":"office"}'

# 4. Verify Kafka topic has messages
kubectl exec -n asset-tracker deploy/kafka -- \
  /opt/kafka/bin/kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic device-events \
    --from-beginning \
    --max-messages 1 \
    --timeout-ms 5000

# 5. Verify MongoDB has the event (requires mongo client)
kubectl exec -n asset-tracker deploy/mongo -- \
  mongosh --quiet \
    -u mongo -p changeme \
    --authenticationDatabase admin \
    asset_tracker \
    --eval "db.device_events.find().pretty()"
```

---

## Verify Probes

```bash
kubectl describe pod -l app=postgres -n asset-tracker | grep -A5 -i probe
kubectl describe pod -l app=mongo -n asset-tracker | grep -A5 -i probe
kubectl describe pod -l app=kafka -n asset-tracker | grep -A5 -i probe
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

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Pod `Init:CrashLoopBackOff` | Missing images not loaded into cluster | Run `kind load docker-image ...` first |
| Kafka pod not ready | Insufficient resources (memory) | Increase Docker memory limit, or reduce Kafka resource requests |
| `pg_isready` fails | PostgreSQL still initializing | Wait, or increase `initialDelaySeconds` |
| Topic already exists error | Topic created twice | Use `--if-not-exists` flag (already included in lifecycle hook) |
| ImagePullBackOff | Image not found | Ensure images are built and loaded into the cluster |
