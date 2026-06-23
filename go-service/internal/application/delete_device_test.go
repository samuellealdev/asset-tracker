package application_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

func TestDeleteDeviceUseCase_Execute(t *testing.T) {
	t.Run("deletes device and publishes event", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		var deletedID string
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			deleteFunc: func(_ context.Context, id string) error {
				deletedID = id
				return nil
			},
		}
		pub := &mockEventPublisher{}
		pub.wg.Add(1)
		uc := application.NewDeleteDeviceUseCase(repo, pub)

		err := uc.Execute(context.Background(), d.ID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if deletedID != d.ID {
			t.Errorf("expected delete with ID %q, got %q", d.ID, deletedID)
		}

		pub.wg.Wait()
		if pub.DeletedCallCount() != 1 {
			t.Errorf("expected 1 PublishDeviceDeleted call, got %d", pub.DeletedCallCount())
		}
		lastID, lastName, timestamp, ok := pub.LastDeletedCall()
		if !ok {
			t.Fatal("expected at least one deleted call")
		}
		if lastID != d.ID {
			t.Errorf("expected device ID %q, got %q", d.ID, lastID)
		}
		if lastName != "laptop" {
			t.Errorf("expected name 'laptop', got %q", lastName)
		}
		if timestamp.IsZero() {
			t.Error("expected non-zero timestamp")
		}
		if timestamp.Equal(d.CreatedAt) {
			t.Error("deleted event timestamp should differ from device CreatedAt")
		}
		now := time.Now().UTC()
		if now.Sub(timestamp) > 5*time.Second {
			t.Errorf("deleted timestamp should be recent, got %v (now=%v)", timestamp, now)
		}
	})

	t.Run("publishes event even when publisher returns error", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			deleteFunc: func(_ context.Context, id string) error {
				return nil
			},
		}
		pub := &mockEventPublisher{returnErr: errors.New("kafka down")}
		pub.wg.Add(1)
		uc := application.NewDeleteDeviceUseCase(repo, pub)

		err := uc.Execute(context.Background(), d.ID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		pub.wg.Wait()
		if pub.DeletedCallCount() != 1 {
			t.Errorf("expected 1 publish call even on error, got %d", pub.DeletedCallCount())
		}
	})

	t.Run("does not publish event when device not found", func(t *testing.T) {
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return nil, application.ErrNotFound
			},
		}
		pub := &mockEventPublisher{}
		uc := application.NewDeleteDeviceUseCase(repo, pub)

		err := uc.Execute(context.Background(), "nonexistent-id")
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

	t.Run("does not publish event when repository delete fails", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		repo := &mockDeviceRepository{
			findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return d, nil
			},
			deleteFunc: func(_ context.Context, id string) error {
				return errors.New("db connection failed")
			},
		}
		pub := &mockEventPublisher{}
		uc := application.NewDeleteDeviceUseCase(repo, pub)

		err := uc.Execute(context.Background(), d.ID)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if pub.TotalCalls() != 0 {
			t.Error("expected no publish calls when delete fails")
		}
	})
}
