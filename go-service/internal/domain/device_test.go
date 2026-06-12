package domain_test

import (
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

func TestNewDevice(t *testing.T) {
	t.Run("returns error when name is empty", func(t *testing.T) {
		_, err := domain.NewDevice("", "computer")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("returns error when type is empty", func(t *testing.T) {
		_, err := domain.NewDevice("laptop", "")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("returns error when both name and type are empty", func(t *testing.T) {
		_, err := domain.NewDevice("", "")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("creates device with valid inputs", func(t *testing.T) {
		d, err := domain.NewDevice("laptop", "computer")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if d.ID == "" {
			t.Fatal("expected non-empty ID")
		}
		if d.Name != "laptop" {
			t.Errorf("expected name 'laptop', got %q", d.Name)
		}
		if d.Type != "computer" {
			t.Errorf("expected type 'computer', got %q", d.Type)
		}
		if d.CreatedAt.IsZero() {
			t.Fatal("expected non-zero CreatedAt")
		}
	})

	t.Run("generates unique UUIDs for each device", func(t *testing.T) {
		d1, _ := domain.NewDevice("laptop", "computer")
		d2, _ := domain.NewDevice("server", "infrastructure")
		if d1.ID == d2.ID {
			t.Fatal("expected different UUIDs for different devices")
		}
	})
}

func TestDeviceUpdate(t *testing.T) {
	t.Run("returns error when name is empty", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		err := d.Update("", "server")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("returns error when type is empty", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		err := d.Update("server", "")
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("updates name and type with valid inputs", func(t *testing.T) {
		d, _ := domain.NewDevice("laptop", "computer")
		err := d.Update("server", "infrastructure")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if d.Name != "server" {
			t.Errorf("expected name 'server', got %q", d.Name)
		}
		if d.Type != "infrastructure" {
			t.Errorf("expected type 'infrastructure', got %q", d.Type)
		}
	})
}
