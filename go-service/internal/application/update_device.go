package application

import (
	"context"
	"log/slog"
	"time"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// UpdateDeviceUseCase handles updating an existing device.
type UpdateDeviceUseCase struct {
	repo            DeviceRepository
	eventPublisher  EventPublisher
}

// NewUpdateDeviceUseCase creates a new UpdateDeviceUseCase.
func NewUpdateDeviceUseCase(repo DeviceRepository, publisher EventPublisher) *UpdateDeviceUseCase {
	return &UpdateDeviceUseCase{
		repo:            repo,
		eventPublisher:  publisher,
	}
}

// Execute updates the device with the given ID. Returns ErrNotFound if the
// device doesn't exist, or a validation error if name or type is empty.
// On success, publishes a device.updated event asynchronously.
func (uc *UpdateDeviceUseCase) Execute(ctx context.Context, id, name, deviceType string) (*domain.Device, error) {
	device, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if err := device.Update(name, deviceType); err != nil {
		return nil, err
	}

	if err := uc.repo.Update(ctx, device); err != nil {
		return nil, err
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("panic in event publisher", "deviceId", device.ID, "recover", r)
			}
		}()
		// Use context.Background() so Kafka write survives HTTP response lifecycle.
		if err := uc.eventPublisher.PublishDeviceUpdated(context.Background(), device.ID, device.Name, time.Now().UTC()); err != nil {
			slog.Error("failed to publish device.updated", "deviceId", device.ID, "error", err)
		}
	}()

	return device, nil
}
