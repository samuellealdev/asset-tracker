package interfaces

import (
	"context"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// mockRepo is a simple in-memory repository for testing the concrete use case wiring.
type mockRepo struct {
	saveFunc    func(ctx context.Context, device *domain.Device) error
	findAllFunc func(ctx context.Context) ([]*domain.Device, error)
	findByIDFunc func(ctx context.Context, id string) (*domain.Device, error)
	updateFunc  func(ctx context.Context, device *domain.Device) error
	deleteFunc  func(ctx context.Context, id string) error
}

func (m *mockRepo) Save(ctx context.Context, device *domain.Device) error {
	return m.saveFunc(ctx, device)
}
func (m *mockRepo) FindAll(ctx context.Context) ([]*domain.Device, error) {
	return m.findAllFunc(ctx)
}
func (m *mockRepo) FindByID(ctx context.Context, id string) (*domain.Device, error) {
	return m.findByIDFunc(ctx, id)
}
func (m *mockRepo) Update(ctx context.Context, device *domain.Device) error {
	return m.updateFunc(ctx, device)
}
func (m *mockRepo) Delete(ctx context.Context, id string) error {
	return m.deleteFunc(ctx, id)
}

func TestDeviceUseCasesWiring(t *testing.T) {
	device := &domain.Device{ID: "abc", Name: "laptop", Type: "computer"}
	repo := &mockRepo{
		saveFunc: func(_ context.Context, d *domain.Device) error { return nil },
		findAllFunc: func(_ context.Context) ([]*domain.Device, error) {
			return []*domain.Device{device}, nil
		},
		findByIDFunc: func(_ context.Context, id string) (*domain.Device, error) {
			return device, nil
		},
		updateFunc: func(_ context.Context, d *domain.Device) error { return nil },
		deleteFunc: func(_ context.Context, id string) error { return nil },
	}

	uc := NewDeviceUseCases(
		application.NewCreateDeviceUseCase(repo),
		application.NewListDevicesUseCase(repo),
		application.NewGetDeviceUseCase(repo),
		application.NewUpdateDeviceUseCase(repo),
		application.NewDeleteDeviceUseCase(repo),
	)

	t.Run("Create delegates to use case", func(t *testing.T) {
		d, err := uc.Create(context.Background(), "laptop", "computer")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if d.Name != "laptop" {
			t.Errorf("expected name 'laptop', got %q", d.Name)
		}
	})

	t.Run("List delegates to use case", func(t *testing.T) {
		devices, err := uc.List(context.Background())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(devices) != 1 {
			t.Errorf("expected 1 device, got %d", len(devices))
		}
	})

	t.Run("Get delegates to use case", func(t *testing.T) {
		d, err := uc.Get(context.Background(), "abc")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if d.ID != "abc" {
			t.Errorf("expected id 'abc', got %q", d.ID)
		}
	})

	t.Run("Update delegates to use case", func(t *testing.T) {
		d, err := uc.Update(context.Background(), "abc", "server", "infra")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if d.Name != "server" {
			t.Errorf("expected name 'server', got %q", d.Name)
		}
	})

	t.Run("Delete delegates to use case", func(t *testing.T) {
		err := uc.Delete(context.Background(), "abc")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}
