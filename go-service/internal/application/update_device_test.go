package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

func TestUpdateDeviceUseCase_Execute(t *testing.T) {
	t.Run("updates device successfully", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			updateFunc: func(_ context.Context, device *domain.Device) error {
				return nil
			},
		}
		uc := application.NewUpdateDeviceUseCase(repo)

		result, err := uc.Execute(context.Background(), d.ID, "server", "infrastructure")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.Name != "server" {
			t.Errorf("expected name 'server', got %q", result.Name)
		}
		if result.Type != "infrastructure" {
			t.Errorf("expected type 'infrastructure', got %q", result.Type)
		}
	})

	t.Run("returns ErrNotFound when device does not exist", func(t *testing.T) {
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return nil, application.ErrNotFound
			},
		}
		uc := application.NewUpdateDeviceUseCase(repo)

		_, err := uc.Execute(context.Background(), "nonexistent-id", "server", "infrastructure")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("returns validation error when name is empty", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
		}
		uc := application.NewUpdateDeviceUseCase(repo)

		_, err := uc.Execute(context.Background(), d.ID, "", "infrastructure")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("returns error when repository update fails", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			updateFunc: func(_ context.Context, device *domain.Device) error {
				return errors.New("db connection failed")
			},
		}
		uc := application.NewUpdateDeviceUseCase(repo)

		_, err := uc.Execute(context.Background(), d.ID, "server", "infrastructure")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})
}
