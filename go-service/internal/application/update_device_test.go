package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

func TestUpdateDeviceUseCase_Execute(t *testing.T) {
	t.Run("updates device and publishes event", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			updateFunc: func(_ context.Context, device *domain.Device) error {
				return nil
			},
		}
		pub := &mockEventPublisher{}
		pub.wg.Add(1)
		uc := application.NewUpdateDeviceUseCase(repo, pub)

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

		pub.wg.Wait()
		if pub.UpdatedCallCount() != 1 {
			t.Errorf("expected 1 PublishDeviceUpdated call, got %d", pub.UpdatedCallCount())
		}
		lastID, lastName, _, ok := pub.LastUpdatedCall()
		if !ok {
			t.Fatal("expected at least one updated call")
		}
		if lastID != d.ID {
			t.Errorf("expected device ID %q, got %q", d.ID, lastID)
		}
		if lastName != "server" {
			t.Errorf("expected name 'server', got %q", lastName)
		}
	})

	t.Run("publishes event even when publisher returns error", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			updateFunc: func(_ context.Context, device *domain.Device) error {
				return nil
			},
		}
		pub := &mockEventPublisher{returnErr: errors.New("kafka down")}
		pub.wg.Add(1)
		uc := application.NewUpdateDeviceUseCase(repo, pub)

		device, err := uc.Execute(context.Background(), d.ID, "server", "infrastructure")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if device == nil {
			t.Fatal("expected non-nil device")
		}

		pub.wg.Wait()
		if pub.UpdatedCallCount() != 1 {
			t.Errorf("expected 1 publish call even on error, got %d", pub.UpdatedCallCount())
		}
	})

	t.Run("does not publish event when device not found", func(t *testing.T) {
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return nil, application.ErrNotFound
			},
		}
		pub := &mockEventPublisher{}
		uc := application.NewUpdateDeviceUseCase(repo, pub)

		_, err := uc.Execute(context.Background(), "nonexistent-id", "server", "infrastructure")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
		if pub.TotalCalls() != 0 {
			t.Error("expected no publish calls when device not found")
		}
	})

	t.Run("does not publish event when name is empty", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
		}
		pub := &mockEventPublisher{}
		uc := application.NewUpdateDeviceUseCase(repo, pub)

		_, err := uc.Execute(context.Background(), d.ID, "", "infrastructure")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if pub.TotalCalls() != 0 {
			t.Error("expected no publish calls when validation fails")
		}
	})

	t.Run("does not publish event when repository update fails", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			updateFunc: func(_ context.Context, device *domain.Device) error {
				return errors.New("db connection failed")
			},
		}
		pub := &mockEventPublisher{}
		uc := application.NewUpdateDeviceUseCase(repo, pub)

		_, err := uc.Execute(context.Background(), d.ID, "server", "infrastructure")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if pub.TotalCalls() != 0 {
			t.Error("expected no publish calls when update fails")
		}
	})
}
