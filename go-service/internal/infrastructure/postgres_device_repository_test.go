package infrastructure_test

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
	"github.com/samuellealdev/asset-tracker/go-service/internal/infrastructure"
)

func connectPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("POSTGRES_DSN")
	if dsn == "" {
		t.Skip("POSTGRES_DSN not set — skipping integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("failed to connect to postgres: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func TestPostgresDeviceRepository_Save(t *testing.T) {
	pool := connectPool(t)
	ctx := context.Background()

	// Run migration
	if err := infrastructure.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("failed to run migration: %v", err)
	}

	repo := infrastructure.NewPostgresDeviceRepository(pool)

	t.Run("saves and retrieves a device", func(t *testing.T) {
		d, err := domain.NewDevice("integration-laptop", "computer")
		if err != nil {
			t.Fatalf("failed to create device: %v", err)
		}

		if err := repo.Save(ctx, d); err != nil {
			t.Fatalf("failed to save device: %v", err)
		}

		got, err := repo.FindByID(ctx, d.ID)
		if err != nil {
			t.Fatalf("failed to find device: %v", err)
		}
		if got.Name != d.Name {
			t.Errorf("expected name %q, got %q", d.Name, got.Name)
		}
		if got.Type != d.Type {
			t.Errorf("expected type %q, got %q", d.Type, got.Type)
		}

		// Cleanup
		if err := repo.Delete(ctx, d.ID); err != nil {
			t.Fatalf("failed to cleanup: %v", err)
		}
	})
}

func TestPostgresDeviceRepository_FindAll(t *testing.T) {
	pool := connectPool(t)
	ctx := context.Background()

	if err := infrastructure.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("failed to run migration: %v", err)
	}

	// Ensure clean state — other tests may have left data
	if _, err := pool.Exec(ctx, "DELETE FROM devices"); err != nil {
		t.Fatalf("failed to clean devices table: %v", err)
	}

	repo := infrastructure.NewPostgresDeviceRepository(pool)

	t.Run("returns empty list when no devices", func(t *testing.T) {
		devices, err := repo.FindAll(ctx)
		if err != nil {
			t.Fatalf("failed to find all: %v", err)
		}
		// Should be empty slice, not nil
		if devices == nil {
			t.Fatal("expected non-nil slice")
		}
		if len(devices) != 0 {
			t.Errorf("expected 0 devices, got %d", len(devices))
		}
	})

	t.Run("returns all saved devices", func(t *testing.T) {
		d1, _ := domain.NewDevice("findall-test-1", "computer")
		d2, _ := domain.NewDevice("findall-test-2", "server")

		_ = repo.Save(ctx, d1)
		_ = repo.Save(ctx, d2)
		t.Cleanup(func() {
			_ = repo.Delete(ctx, d1.ID)
			_ = repo.Delete(ctx, d2.ID)
		})

		devices, err := repo.FindAll(ctx)
		if err != nil {
			t.Fatalf("failed to find all: %v", err)
		}
		if len(devices) < 2 {
			t.Errorf("expected at least 2 devices, got %d", len(devices))
		}
	})
}

func TestPostgresDeviceRepository_FindByID(t *testing.T) {
	pool := connectPool(t)
	ctx := context.Background()

	if err := infrastructure.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("failed to run migration: %v", err)
	}

	repo := infrastructure.NewPostgresDeviceRepository(pool)

	t.Run("returns ErrNotFound for nonexistent ID", func(t *testing.T) {
		_, err := repo.FindByID(ctx, "00000000-0000-0000-0000-000000000000")
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("returns device for existing ID", func(t *testing.T) {
		d, _ := domain.NewDevice("findbyid-test", "computer")
		if err := repo.Save(ctx, d); err != nil {
			t.Fatalf("failed to save: %v", err)
		}
		t.Cleanup(func() { _ = repo.Delete(ctx, d.ID) })

		got, err := repo.FindByID(ctx, d.ID)
		if err != nil {
			t.Fatalf("failed to find by ID: %v", err)
		}
		if got.ID != d.ID {
			t.Errorf("expected ID %q, got %q", d.ID, got.ID)
		}
	})
}

func TestPostgresDeviceRepository_Update(t *testing.T) {
	pool := connectPool(t)
	ctx := context.Background()

	if err := infrastructure.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("failed to run migration: %v", err)
	}

	repo := infrastructure.NewPostgresDeviceRepository(pool)

	t.Run("updates existing device", func(t *testing.T) {
		d, _ := domain.NewDevice("update-before", "computer")
		if err := repo.Save(ctx, d); err != nil {
			t.Fatalf("failed to save: %v", err)
		}
		t.Cleanup(func() { _ = repo.Delete(ctx, d.ID) })

		d.Name = "update-after"
		d.Type = "server"
		if err := repo.Update(ctx, d); err != nil {
			t.Fatalf("failed to update: %v", err)
		}

		got, _ := repo.FindByID(ctx, d.ID)
		if got.Name != "update-after" {
			t.Errorf("expected name 'update-after', got %q", got.Name)
		}
		if got.Type != "server" {
			t.Errorf("expected type 'server', got %q", got.Type)
		}
	})

	t.Run("returns ErrNotFound for nonexistent device", func(t *testing.T) {
		d, _ := domain.NewDevice("ghost", "ghost")
		d.ID = "00000000-0000-0000-0000-000000000000"
		err := repo.Update(ctx, d)
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestPostgresDeviceRepository_Delete(t *testing.T) {
	pool := connectPool(t)
	ctx := context.Background()

	if err := infrastructure.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("failed to run migration: %v", err)
	}

	repo := infrastructure.NewPostgresDeviceRepository(pool)

	t.Run("deletes existing device", func(t *testing.T) {
		d, _ := domain.NewDevice("delete-test", "computer")
		if err := repo.Save(ctx, d); err != nil {
			t.Fatalf("failed to save: %v", err)
		}

		if err := repo.Delete(ctx, d.ID); err != nil {
			t.Fatalf("failed to delete: %v", err)
		}

		_, err := repo.FindByID(ctx, d.ID)
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound after delete, got %v", err)
		}
	})

	t.Run("returns ErrNotFound for nonexistent device", func(t *testing.T) {
		err := repo.Delete(ctx, "00000000-0000-0000-0000-000000000000")
		if !errors.Is(err, application.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}
