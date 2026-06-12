package application

import (
	"context"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// GetDeviceUseCase handles retrieving a single device by ID.
type GetDeviceUseCase struct {
	repo DeviceRepository
}

// NewGetDeviceUseCase creates a new GetDeviceUseCase.
func NewGetDeviceUseCase(repo DeviceRepository) *GetDeviceUseCase {
	return &GetDeviceUseCase{repo: repo}
}

// Execute returns the device with the given ID, or ErrNotFound if it doesn't exist.
func (uc *GetDeviceUseCase) Execute(ctx context.Context, id string) (*domain.Device, error) {
	device, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return device, nil
}
