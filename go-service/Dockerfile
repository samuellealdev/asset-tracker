# Stage 1: Build the Go binary
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Cache dependencies in a separate layer
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true

# Build the source
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/main.go

# Stage 2: Minimal runtime image
FROM gcr.io/distroless/static:nonroot

COPY --from=builder /server /

EXPOSE 8080

USER nonroot:nonroot

# The binary supports healthcheck mode: /server healthcheck
CMD ["/server"]
