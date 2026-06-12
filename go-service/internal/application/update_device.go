package application

import (
	"context"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// UpdateDeviceUseCase handles updating an existing device.
type UpdateDeviceUseCase struct {
	repo DeviceRepository
}

// NewUpdateDeviceUseCase creates a new UpdateDeviceUseCase.
func NewUpdateDeviceUseCase(repo DeviceRepository) *UpdateDeviceUseCase {
	return &UpdateDeviceUseCase{repo: repo}
}

// Execute updates the device with the given ID. Returns ErrNotFound if the
// device doesn't exist, or a validation error if name or type is empty.
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

	return device, nil
}
