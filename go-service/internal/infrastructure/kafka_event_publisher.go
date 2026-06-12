package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
)

// Compile-time check: KafkaEventPublisher implements EventPublisher.
var _ application.EventPublisher = (*KafkaEventPublisher)(nil)

// eventPayload is the JSON structure published to the Kafka topic.
type eventPayload struct {
	Type      string `json:"type"`
	DeviceID  string `json:"deviceId"`
	Name      string `json:"name"`
	Timestamp string `json:"timestamp"`
}

// KafkaEventPublisher is an infrastructure adapter that publishes device
// lifecycle events to a Kafka topic using the segmentio/kafka-go library.
type KafkaEventPublisher struct {
	writer *kafka.Writer
}

// NewKafkaEventPublisher creates a new KafkaEventPublisher backed by the given
// kafka.Writer. The caller is responsible for closing the writer via Close().
func NewKafkaEventPublisher(writer *kafka.Writer) *KafkaEventPublisher {
	return &KafkaEventPublisher{writer: writer}
}

// PublishDeviceCreated publishes a device.created event to Kafka.
func (p *KafkaEventPublisher) PublishDeviceCreated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error {
	return p.publish(ctx, "device.created", deviceID, deviceName, timestamp)
}

// PublishDeviceUpdated publishes a device.updated event to Kafka.
func (p *KafkaEventPublisher) PublishDeviceUpdated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error {
	return p.publish(ctx, "device.updated", deviceID, deviceName, timestamp)
}

// PublishDeviceDeleted publishes a device.deleted event to Kafka.
func (p *KafkaEventPublisher) PublishDeviceDeleted(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error {
	return p.publish(ctx, "device.deleted", deviceID, deviceName, timestamp)
}

// publish serializes the event and writes it to the Kafka topic.
// The message is keyed by deviceID to ensure partition ordering per device.
func (p *KafkaEventPublisher) publish(ctx context.Context, eventType, deviceID, deviceName string, timestamp time.Time) error {
	payload := eventPayload{
		Type:      eventType,
		DeviceID:  deviceID,
		Name:      deviceName,
		Timestamp: timestamp.Format(time.RFC3339Nano),
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	msg := kafka.Message{
		Key:   []byte(deviceID),
		Value: data,
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("write message: %w", err)
	}

	return nil
}

// Close gracefully shuts down the underlying Kafka writer.
func (p *KafkaEventPublisher) Close() error {
	return p.writer.Close()
}
