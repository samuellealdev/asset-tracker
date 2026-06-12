package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrNameRequired = errors.New("name is required")
	ErrTypeRequired = errors.New("type is required")
)

// Device represents an asset device in the domain.
// It has ZERO framework dependencies — no pgx, no sql, no http.
type Device struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"createdAt"`
}

// NewDevice creates a new Device with the given name and type.
// It validates that both name and type are non-empty, generates a UUID,
// and sets CreatedAt to the current time.
func NewDevice(name, deviceType string) (*Device, error) {
	if name == "" {
		return nil, ErrNameRequired
	}
	if deviceType == "" {
		return nil, ErrTypeRequired
	}

	return &Device{
		ID:        uuid.New().String(),
		Name:      name,
		Type:      deviceType,
		CreatedAt: time.Now().UTC(),
	}, nil
}

// Update validates and mutates the device's Name and Type in-place.
// Returns an error if either field is empty.
func (d *Device) Update(name, deviceType string) error {
	if name == "" {
		return ErrNameRequired
	}
	if deviceType == "" {
		return ErrTypeRequired
	}
	d.Name = name
	d.Type = deviceType
	return nil
}
