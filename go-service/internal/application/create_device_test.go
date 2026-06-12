package application_test

import (
	"context"
	"errors"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// mockDeviceRepository is a manual mock implementing DeviceRepository.
type mockDeviceRepository struct {
	saveFunc    func(ctx context.Context, device *domain.Device) error
	findAllFunc func(ctx context.Context) ([]*domain.Device, error)
	findByIDFunc func(ctx context.Context, id string) (*domain.Device, error)
	updateFunc  func(ctx context.Context, device *domain.Device) error
	deleteFunc  func(ctx context.Context, id string) error
}

func (m *mockDeviceRepository) Save(ctx context.Context, device *domain.Device) error {
	return m.saveFunc(ctx, device)
}
func (m *mockDeviceRepository) FindAll(ctx context.Context) ([]*domain.Device, error) {
	return m.findAllFunc(ctx)
}
func (m *mockDeviceRepository) FindByID(ctx context.Context, id string) (*domain.Device, error) {
	return m.findByIDFunc(ctx, id)
}
func (m *mockDeviceRepository) Update(ctx context.Context, device *domain.Device) error {
	return m.updateFunc(ctx, device)
}
func (m *mockDeviceRepository) Delete(ctx context.Context, id string) error {
	return m.deleteFunc(ctx, id)
}

func TestCreateDeviceUseCase_Execute(t *testing.T) {
	t.Run("creates device and publishes event", func(t *testing.T) {
		var saved *domain.Device
		repo := &mockDeviceRepository{
			saveFunc: func(_ context.Context, d *domain.Device) error {
				saved = d
				return nil
			},
		}
		pub := &mockEventPublisher{}
		pub.wg.Add(1)
		uc := application.NewCreateDeviceUseCase(repo, pub)

		device, err := uc.Execute(context.Background(), "laptop", "computer")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if device == nil {
			t.Fatal("expected non-nil device")
		}
		if device.Name != "laptop" {
			t.Errorf("expected name 'laptop', got %q", device.Name)
		}
		if device.Type != "computer" {
			t.Errorf("expected type 'computer', got %q", device.Type)
		}
		if device.ID == "" {
			t.Error("expected non-empty ID")
		}
		if saved == nil {
			t.Fatal("expected device to be saved")
		}
		if saved.ID != device.ID {
			t.Error("saved device should match returned device")
		}

		pub.wg.Wait()
		if pub.CreatedCallCount() != 1 {
			t.Errorf("expected 1 PublishDeviceCreated call, got %d", pub.CreatedCallCount())
		}
		lastID, lastName, _, ok := pub.LastCreatedCall()
		if !ok {
			t.Fatal("expected at least one created call")
		}
		if lastID != device.ID {
			t.Errorf("expected device ID %q, got %q", device.ID, lastID)
		}
		if lastName != "laptop" {
			t.Errorf("expected name 'laptop', got %q", lastName)
		}
	})

	t.Run("publishes event even when publisher returns error", func(t *testing.T) {
		repo := &mockDeviceRepository{
			saveFunc: func(_ context.Context, d *domain.Device) error {
				return nil
			},
		}
		pub := &mockEventPublisher{returnErr: errors.New("kafka down")}
		pub.wg.Add(1)
		uc := application.NewCreateDeviceUseCase(repo, pub)

		device, err := uc.Execute(context.Background(), "laptop", "computer")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if device == nil {
			t.Fatal("expected non-nil device")
		}

		pub.wg.Wait()
		if pub.CreatedCallCount() != 1 {
			t.Errorf("expected 1 publish call even on error, got %d", pub.CreatedCallCount())
		}
	})

	t.Run("does not publish event when name is empty", func(t *testing.T) {
		repo := &mockDeviceRepository{}
		pub := &mockEventPublisher{}
		uc := application.NewCreateDeviceUseCase(repo, pub)

		_, err := uc.Execute(context.Background(), "", "computer")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if pub.TotalCalls() != 0 {
			t.Error("expected no publish calls when creation fails")
		}
	})

	t.Run("does not publish event when repository save fails", func(t *testing.T) {
		repo := &mockDeviceRepository{
			saveFunc: func(_ context.Context, d *domain.Device) error {
				return errors.New("db connection failed")
			},
		}
		pub := &mockEventPublisher{}
		uc := application.NewCreateDeviceUseCase(repo, pub)

		_, err := uc.Execute(context.Background(), "laptop", "computer")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if pub.TotalCalls() != 0 {
			t.Error("expected no publish calls when save fails")
		}
	})
}
