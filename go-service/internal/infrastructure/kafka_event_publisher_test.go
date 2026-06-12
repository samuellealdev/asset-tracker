package infrastructure_test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/infrastructure"
)

func testBroker(t *testing.T) string {
	t.Helper()
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		t.Skip("KAFKA_BROKER not set — skipping integration test")
	}
	return broker
}

func uniqueTopic(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}

// mustReader creates a Kafka reader starting from the first available offset
// on partition 0. The reader is cleaned up via t.Cleanup.
func mustReader(t *testing.T, broker, topic string) *kafka.Reader {
	t.Helper()
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{broker},
		Topic:     topic,
		Partition: 0,
		MinBytes:  1,
		MaxBytes:  10e6,
		MaxWait:   5 * time.Second,
	})
	if err := reader.SetOffset(kafka.FirstOffset); err != nil {
		t.Fatalf("set offset: %v", err)
	}
	t.Cleanup(func() { reader.Close() })
	return reader
}

func TestKafkaEventPublisher_PublishAllTypes(t *testing.T) {
	broker := testBroker(t)
	topic := uniqueTopic("device-events-all")
	deviceID := "550e8400-e29b-41d4-a716-446655440000"

	writer := &kafka.Writer{
		Addr:                     kafka.TCP(broker),
		Topic:                    topic,
		Balancer:                 &kafka.LeastBytes{},
		BatchTimeout:             50 * time.Millisecond,
		AllowAutoTopicCreation:   true,
	}
	t.Cleanup(func() { writer.Close() })

	publisher := infrastructure.NewKafkaEventPublisher(writer)
	ctx := context.Background()
	now := time.Now().UTC()

	t.Run("publishes device.created", func(t *testing.T) {
		if err := publisher.PublishDeviceCreated(ctx, deviceID, "laptop", now); err != nil {
			t.Fatalf("PublishDeviceCreated: %v", err)
		}
	})

	t.Run("publishes device.updated", func(t *testing.T) {
		if err := publisher.PublishDeviceUpdated(ctx, deviceID, "server", now); err != nil {
			t.Fatalf("PublishDeviceUpdated: %v", err)
		}
	})

	t.Run("publishes device.deleted", func(t *testing.T) {
		if err := publisher.PublishDeviceDeleted(ctx, deviceID, "server", now); err != nil {
			t.Fatalf("PublishDeviceDeleted: %v", err)
		}
	})

	// Read back and verify all three messages in order.
	reader := mustReader(t, broker, topic)

	expected := []struct {
		eventType string
		name      string
	}{
		{eventType: "device.created", name: "laptop"},
		{eventType: "device.updated", name: "server"},
		{eventType: "device.deleted", name: "server"},
	}

	for _, exp := range expected {
		readCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		msg, err := reader.ReadMessage(readCtx)
		cancel()
		if err != nil {
			t.Fatalf("read message for %s: %v", exp.eventType, err)
		}

		if string(msg.Key) != deviceID {
			t.Errorf("expected key %q, got %q", deviceID, string(msg.Key))
		}

		var payload map[string]string
		if err := json.Unmarshal(msg.Value, &payload); err != nil {
			t.Fatalf("unmarshal payload: %v", err)
		}

		if payload["type"] != exp.eventType {
			t.Errorf("expected type %q, got %q", exp.eventType, payload["type"])
		}
		if payload["deviceId"] != deviceID {
			t.Errorf("expected deviceId %q, got %q", deviceID, payload["deviceId"])
		}
		if payload["name"] != exp.name {
			t.Errorf("expected name %q, got %q", exp.name, payload["name"])
		}
		if _, err := time.Parse(time.RFC3339Nano, payload["timestamp"]); err != nil {
			t.Errorf("invalid timestamp %q: %v", payload["timestamp"], err)
		}
	}
}

func TestKafkaEventPublisher_ImplementsInterface(t *testing.T) {
	// Compile-time check: ensure the concrete type satisfies the port interface.
	var _ application.EventPublisher = (*infrastructure.KafkaEventPublisher)(nil)
}

func TestKafkaEventPublisher_ErrorOnUnreachableBroker(t *testing.T) {
	writer := &kafka.Writer{
		Addr:         kafka.TCP("localhost:99999"),
		Topic:        "test",
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 50 * time.Millisecond,
		WriteTimeout: 2 * time.Second,
	}
	t.Cleanup(func() { writer.Close() })

	publisher := infrastructure.NewKafkaEventPublisher(writer)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := publisher.PublishDeviceCreated(ctx, "dev-1", "laptop", time.Now().UTC())
	if err == nil {
		t.Fatal("expected error when broker is unreachable, got nil")
	}
	t.Logf("got expected error: %v", err)
}

func TestKafkaEventPublisher_ContextCancellation(t *testing.T) {
	broker := testBroker(t)
	topic := uniqueTopic("device-events-cancel")

	writer := &kafka.Writer{
		Addr:         kafka.TCP(broker),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 1 * time.Minute, // prevent fast batching
		WriteTimeout: 1 * time.Minute, // prevent fast timeout
	}
	t.Cleanup(func() { writer.Close() })

	publisher := infrastructure.NewKafkaEventPublisher(writer)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // immediately cancel

	err := publisher.PublishDeviceCreated(ctx, "dev-1", "laptop", time.Now().UTC())
	if err == nil {
		t.Fatal("expected error when context is cancelled, got nil")
	}
	t.Logf("got expected error: %v", err)
}
