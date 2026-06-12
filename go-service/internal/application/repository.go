package application

import (
	"context"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// DeviceRepository defines the outbound port for device persistence.
// Following DIP: the application layer owns the interface, infrastructure implements it.
type DeviceRepository interface {
	Save(ctx context.Context, device *domain.Device) error
	FindAll(ctx context.Context) ([]*domain.Device, error)
	FindByID(ctx context.Context, id string) (*domain.Device, error)
	Update(ctx context.Context, device *domain.Device) error
	Delete(ctx context.Context, id string) error
}
