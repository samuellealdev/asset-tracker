package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

func TestGetDeviceUseCase_Execute(t *testing.T) {
	t.Run("returns device when found", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				if id == d.ID {
					return d, nil
				}
				return nil, application.ErrNotFound
			},
		}
		uc := application.NewGetDeviceUseCase(repo)

		result, err := uc.Execute(context.Background(), d.ID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.ID != d.ID {
			t.Errorf("expected ID %q, got %q", d.ID, result.ID)
		}
	})

	t.Run("returns ErrNotFound when device does not exist", func(t *testing.T) {
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return nil, application.ErrNotFound
			},
		}
		uc := application.NewGetDeviceUseCase(repo)

		_, err := uc.Execute(context.Background(), "nonexistent-id")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}
