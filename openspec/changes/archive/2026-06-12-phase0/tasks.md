# Phase 0 — Tasks

## Task List

- [x] 1. Create project directory structure
- [x] 2. Define docker-compose.yml with 5 services on app-network
- [x] 3. Configure PostgreSQL 16 with persistent volume and healthcheck
- [x] 4. Configure MongoDB 7 with persistent volume and healthcheck
- [x] 5. Configure Kafka in KRaft mode with healthcheck
- [x] 6. Create go-service Dockerfile (multi-stage, distroless)
- [x] 7. Create go-service main.go with /health endpoint
- [x] 8. Create go-service go.mod
- [x] 9. Create node-service Dockerfile (multi-stage, alpine slim)
- [x] 10. Create node-service package.json
- [x] 11. Create node-service index.js with /health endpoint
- [x] 12. Configure depends_on with service_healthy conditions
- [x] 13. Create .env.example with all required environment variables
- [x] 14. Verify all 5 containers start and become healthy
- [x] 15. Verify Go health endpoint returns {"status":"ok"}
- [x] 16. Verify Node health endpoint returns {"status":"ok"}
- [x] 17. Verify Kafka is reachable via kafka-topics.sh
- [x] 18. Verify clean teardown with docker compose down -v
