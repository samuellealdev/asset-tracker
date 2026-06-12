package application

import (
	"context"
	"time"
)

// EventPublisher defines the outbound port for publishing device lifecycle events.
// Following DIP: the application layer owns the interface, infrastructure implements it.
type EventPublisher interface {
	PublishDeviceCreated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error
	PublishDeviceUpdated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error
	PublishDeviceDeleted(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error
}
