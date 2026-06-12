package interfaces

import (
	"context"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// deviceUseCases is the concrete implementation of DeviceUseCases.
// It composes all 5 use case structs and delegates to them.
type deviceUseCases struct {
	create *application.CreateDeviceUseCase
	list   *application.ListDevicesUseCase
	get    *application.GetDeviceUseCase
	update *application.UpdateDeviceUseCase
	delete *application.DeleteDeviceUseCase
}

// NewDeviceUseCases creates a new DeviceUseCases implementation.
// This is the composition root's entry point for wiring use cases.
func NewDeviceUseCases(
	create *application.CreateDeviceUseCase,
	list *application.ListDevicesUseCase,
	get *application.GetDeviceUseCase,
	update *application.UpdateDeviceUseCase,
	delete *application.DeleteDeviceUseCase,
) DeviceUseCases {
	return &deviceUseCases{
		create: create,
		list:   list,
		get:    get,
		update: update,
		delete: delete,
	}
}

func (uc *deviceUseCases) Create(ctx context.Context, name, deviceType string) (*domain.Device, error) {
	return uc.create.Execute(ctx, name, deviceType)
}

func (uc *deviceUseCases) List(ctx context.Context) ([]*domain.Device, error) {
	return uc.list.Execute(ctx)
}

func (uc *deviceUseCases) Get(ctx context.Context, id string) (*domain.Device, error) {
	return uc.get.Execute(ctx, id)
}

func (uc *deviceUseCases) Update(ctx context.Context, id, name, deviceType string) (*domain.Device, error) {
	return uc.update.Execute(ctx, id, name, deviceType)
}

func (uc *deviceUseCases) Delete(ctx context.Context, id string) error {
	return uc.delete.Execute(ctx, id)
}
