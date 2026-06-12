package application

import (
	"context"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// CreateDeviceUseCase handles the creation of a new device.
type CreateDeviceUseCase struct {
	repo DeviceRepository
}

// NewCreateDeviceUseCase creates a new CreateDeviceUseCase.
func NewCreateDeviceUseCase(repo DeviceRepository) *CreateDeviceUseCase {
	return &CreateDeviceUseCase{repo: repo}
}

// Execute creates a new device with the given name and type.
// It validates inputs, creates the domain entity, and persists it.
func (uc *CreateDeviceUseCase) Execute(ctx context.Context, name, deviceType string) (*domain.Device, error) {
	device, err := domain.NewDevice(name, deviceType)
	if err != nil {
		return nil, err
	}

	if err := uc.repo.Save(ctx, device); err != nil {
		return nil, err
	}

	return device, nil
}
