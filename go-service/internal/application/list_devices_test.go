package application_test

import (
	"context"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

func TestListDevicesUseCase_Execute(t *testing.T) {
	t.Run("returns empty list when no devices exist", func(t *testing.T) {
		repo := &mockDeviceRepository{
			findAllFunc: func(_ context.Context) ([]*domain.Device, error) {
				return []*domain.Device{}, nil
			},
		}
		uc := application.NewListDevicesUseCase(repo)

		devices, err := uc.Execute(context.Background())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if devices == nil {
			t.Fatal("expected non-nil slice, got nil")
		}
		if len(devices) != 0 {
			t.Errorf("expected 0 devices, got %d", len(devices))
		}
	})

	t.Run("returns populated list when devices exist", func(t *testing.T) {
		d1, _ := domain.NewDevice("laptop", "computer")
		d2, _ := domain.NewDevice("server", "infrastructure")
		repo := &mockDeviceRepository{
			findAllFunc: func(_ context.Context) ([]*domain.Device, error) {
				return []*domain.Device{d1, d2}, nil
			},
		}
		uc := application.NewListDevicesUseCase(repo)

		devices, err := uc.Execute(context.Background())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(devices) != 2 {
			t.Errorf("expected 2 devices, got %d", len(devices))
		}
	})
}
