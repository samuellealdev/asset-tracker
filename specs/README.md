# Asset Tracker — Development Specs

This directory contains the specification documents for each phase of the Asset Tracker project.

## Project Overview

Asset Tracker is a microservices-based application that demonstrates hexagonal architecture, Docker containerization, and Kubernetes orchestration. It consists of two services:

- **go-service**: Go microservice using PostgreSQL (hexagonal architecture)
- **node-service**: Node.js microservice using MongoDB (hexagonal architecture)

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Fase 0 | Project harness and tooling setup | 🔄 In Progress |
| Fase 1 | Go service — core domain and hexagonal skeleton | ⬜ Pending |
| Fase 2 | Node service — core domain and hexagonal skeleton | ⬜ Pending |
| Fase 3 | Docker — containerization and docker-compose | ⬜ Pending |
| Fase 4 | Kubernetes — manifests and local cluster deployment | ⬜ Pending |
| Fase 5 | Integration — inter-service communication and E2E tests | ⬜ Pending |

## Architecture Principles

- **Hexagonal Architecture**: ports & adapters pattern; domain logic isolated from infrastructure
- **SOLID**: all five principles applied throughout
- **TDD**: test-driven development for all business logic
- **12-Factor App**: configuration via environment variables, stateless processes

## Conventions

- Spec documents follow the SDD (Spec-Driven Development) format
- Each phase has its own subdirectory with `proposal.md`, `spec.md`, `design.md`, and `tasks.md`
- Code follows the conventions defined in each service's respective skill files
