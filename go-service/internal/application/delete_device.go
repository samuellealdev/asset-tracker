package application

import "context"

// DeleteDeviceUseCase handles deleting a device by ID.
type DeleteDeviceUseCase struct {
	repo DeviceRepository
}

// NewDeleteDeviceUseCase creates a new DeleteDeviceUseCase.
func NewDeleteDeviceUseCase(repo DeviceRepository) *DeleteDeviceUseCase {
	return &DeleteDeviceUseCase{repo: repo}
}

// Execute deletes the device with the given ID. Returns ErrNotFound if the
// device doesn't exist.
func (uc *DeleteDeviceUseCase) Execute(ctx context.Context, id string) error {
	return uc.repo.Delete(ctx, id)
}
