package application

import (
	"context"
	"log/slog"
)

// DeleteDeviceUseCase handles deleting a device by ID.
type DeleteDeviceUseCase struct {
	repo            DeviceRepository
	eventPublisher  EventPublisher
}

// NewDeleteDeviceUseCase creates a new DeleteDeviceUseCase.
func NewDeleteDeviceUseCase(repo DeviceRepository, publisher EventPublisher) *DeleteDeviceUseCase {
	return &DeleteDeviceUseCase{
		repo:            repo,
		eventPublisher:  publisher,
	}
}

// Execute deletes the device with the given ID. Returns ErrNotFound if the
// device doesn't exist. Captures the device name before deleting so the
// device.deleted event includes the name of the deleted device.
func (uc *DeleteDeviceUseCase) Execute(ctx context.Context, id string) error {
	device, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if err := uc.repo.Delete(ctx, id); err != nil {
		return err
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("panic in event publisher", "deviceId", id, "recover", r)
			}
		}()
		// Use context.Background() so Kafka write survives HTTP response lifecycle.
		if err := uc.eventPublisher.PublishDeviceDeleted(context.Background(), id, device.Name, device.CreatedAt); err != nil {
			slog.Error("failed to publish device.deleted", "deviceId", id, "error", err)
		}
	}()

	return nil
}
