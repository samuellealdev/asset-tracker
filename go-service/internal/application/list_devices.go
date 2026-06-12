package application

import (
	"context"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// ListDevicesUseCase handles listing all devices.
type ListDevicesUseCase struct {
	repo DeviceRepository
}

// NewListDevicesUseCase creates a new ListDevicesUseCase.
func NewListDevicesUseCase(repo DeviceRepository) *ListDevicesUseCase {
	return &ListDevicesUseCase{repo: repo}
}

// Execute returns all devices.
func (uc *ListDevicesUseCase) Execute(ctx context.Context) ([]*domain.Device, error) {
	return uc.repo.FindAll(ctx)
}
