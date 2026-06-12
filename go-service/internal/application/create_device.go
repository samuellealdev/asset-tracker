package application

import (
	"context"
	"log/slog"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// CreateDeviceUseCase handles the creation of a new device.
type CreateDeviceUseCase struct {
	repo            DeviceRepository
	eventPublisher  EventPublisher
}

// NewCreateDeviceUseCase creates a new CreateDeviceUseCase.
func NewCreateDeviceUseCase(repo DeviceRepository, publisher EventPublisher) *CreateDeviceUseCase {
	return &CreateDeviceUseCase{
		repo:            repo,
		eventPublisher:  publisher,
	}
}

// Execute creates a new device with the given name and type.
// It validates inputs, creates the domain entity, persists it, and
// publishes a device.created event asynchronously.
func (uc *CreateDeviceUseCase) Execute(ctx context.Context, name, deviceType string) (*domain.Device, error) {
	device, err := domain.NewDevice(name, deviceType)
	if err != nil {
		return nil, err
	}

	if err := uc.repo.Save(ctx, device); err != nil {
		return nil, err
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("panic in event publisher", "deviceId", device.ID, "recover", r)
			}
		}()
		if err := uc.eventPublisher.PublishDeviceCreated(ctx, device.ID, device.Name, device.CreatedAt); err != nil {
			slog.Error("failed to publish device.created", "deviceId", device.ID, "error", err)
		}
	}()

	return device, nil
}
