package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/segmentio/kafka-go"
	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/infrastructure"
	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

func main() {
	// Healthcheck mode: verify the server is responding
	// Used by Docker Compose healthcheck; works in distroless runtime
	// without requiring curl or wget.
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Get("http://localhost:8080/health")
		if err != nil {
			fmt.Fprintf(os.Stderr, "healthcheck failed: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			fmt.Fprintf(os.Stderr, "healthcheck failed: status %d\n", resp.StatusCode)
			os.Exit(1)
		}
		os.Exit(0)
	}

	// Server mode — structured JSON logging via log/slog
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dsn := os.Getenv("POSTGRES_DSN")
	if dsn == "" {
		slog.Error("POSTGRES_DSN environment variable is required")
		os.Exit(1)
	}

	// --- Database connection ---
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		slog.Error("failed to create database pool", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// --- Run migrations ---
	if err := infrastructure.RunMigrations(ctx, pool); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	slog.Info("database migrations completed")

	// --- Infrastructure ---
	deviceRepo := infrastructure.NewPostgresDeviceRepository(pool)

	// --- Kafka Event Publisher ---
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "kafka:9092"
	}
	topic := os.Getenv("KAFKA_TOPIC")
	if topic == "" {
		topic = "device-events"
	}

	kafkaWriter := &kafka.Writer{
		Addr:         kafka.TCP(broker),
		Topic:        topic,
		WriteTimeout: 5 * time.Second,
	}
	eventPublisher := infrastructure.NewKafkaEventPublisher(kafkaWriter)
	slog.Info("kafka event publisher configured", "broker", broker, "topic", topic)

	// --- Application (use cases) ---
	createUseCase := application.NewCreateDeviceUseCase(deviceRepo, eventPublisher)
	listUseCase := application.NewListDevicesUseCase(deviceRepo)
	getUseCase := application.NewGetDeviceUseCase(deviceRepo)
	updateUseCase := application.NewUpdateDeviceUseCase(deviceRepo, eventPublisher)
	deleteUseCase := application.NewDeleteDeviceUseCase(deviceRepo, eventPublisher)

	// --- Interfaces (HTTP handler) ---
	useCases := interfaces.NewDeviceUseCases(
		createUseCase,
		listUseCase,
		getUseCase,
		updateUseCase,
		deleteUseCase,
	)
	deviceHandler := interfaces.NewDeviceHandler(useCases)

	// --- Health handler (separate concern per SRP) ---
	// GET /health (alias for /health/ready, backward compatible)
	// GET /health/live (always 200, liveness probe)
	// GET /health/ready (200 only if DB is reachable, readiness probe)
	healthHandler := interfaces.NewHealthHandler(pool)

	// --- Metrics handler (optional, in-memory counters) ---
	metricsHandler := interfaces.NewMetricsHandler()

	// --- Top-level mux ---
	mux := http.NewServeMux()
	mux.Handle("GET /health", healthHandler)
	mux.Handle("GET /health/live", healthHandler)
	mux.Handle("GET /health/ready", healthHandler)
	mux.Handle("GET /metrics", metricsHandler)
	mux.Handle("/", deviceHandler)

	// --- Wrap entire mux with logging middleware ---
	wrappedMux := interfaces.LoggingMiddleware(mux)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      wrappedMux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	// --- Graceful shutdown ---
	go func() {
		slog.Info("starting server", "port", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
	}

	if err := eventPublisher.Close(); err != nil {
		slog.Error("failed to close Kafka writer", "error", err)
	}

	slog.Info("server stopped")
}
