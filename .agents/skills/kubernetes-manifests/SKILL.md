---
name: kubernetes-manifests
description: "Trigger: Kubernetes, k8s, manifests, deployments, services, configmaps, secrets, ingress. Generate and review Kubernetes YAML manifests following best practices."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Load this skill when the user asks to create, review, or modify Kubernetes manifests, or when the project requires k8s deployment files.

## Hard Rules

- Every Deployment must have `resources.requests` and `resources.limits` defined.
- Use `apps/v1` for Deployments, `v1` for Services and ConfigMaps.
- Never hardcode secrets in manifests; use `Secret` resources or external secret management.
- Use `namespace` in every manifest or ensure namespace isolation.
- Prefer `RollingUpdate` strategy for stateless services.
- Add `livenessProbe` and `readinessProbe` to every container.
- Use labels consistently: `app`, `component`, `tier` at minimum.

## Manifest Structure

```
k8s/
├── namespace.yaml
├── go-service/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── node-service/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── ingress.yaml
└── secrets.yaml (or use external-secrets)
```

## Decision Tree

```
Stateless service?           → Deployment
Stateful (DB, queue)?         → StatefulSet
Internal cluster comms?       → ClusterIP Service
External access?              → LoadBalancer or Ingress
Env-specific config?          → ConfigMap
Sensitive data?               → Secret (or SealedSecret)
Need pod-to-pod comms?        → Headless Service
```

## Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-service
  namespace: asset-tracker
  labels:
    app: go-service
    component: api
    tier: backend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: go-service
  template:
    metadata:
      labels:
        app: go-service
    spec:
      containers:
        - name: go-service
          image: go-service:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 3
            periodSeconds: 5
          envFrom:
            - configMapRef:
                name: go-service-config
            - secretRef:
                name: go-service-secrets
```

## Service Template

```yaml
apiVersion: v1
kind: Service
metadata:
  name: go-service
  namespace: asset-tracker
  labels:
    app: go-service
spec:
  type: ClusterIP
  selector:
    app: go-service
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
      name: http
```
