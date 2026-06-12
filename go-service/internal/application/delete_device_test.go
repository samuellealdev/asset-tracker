package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
)

func TestDeleteDeviceUseCase_Execute(t *testing.T) {
	t.Run("deletes device successfully", func(t *testing.T) {
		var deletedID string
		repo := &mockDeviceRepository{
			deleteFunc: func(_ context.Context, id string) error {
				deletedID = id
				return nil
			},
		}
		uc := application.NewDeleteDeviceUseCase(repo)

		err := uc.Execute(context.Background(), "valid-id")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if deletedID != "valid-id" {
			t.Errorf("expected delete with ID 'valid-id', got %q", deletedID)
		}
	})

	t.Run("returns ErrNotFound when device does not exist", func(t *testing.T) {
		repo := &mockDeviceRepository{
			deleteFunc: func(_ context.Context, id string) error {
				return application.ErrNotFound
			},
		}
		uc := application.NewDeleteDeviceUseCase(repo)

		err := uc.Execute(context.Background(), "nonexistent-id")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}
