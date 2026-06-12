package infrastructure

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// PostgresDeviceRepository implements application.DeviceRepository using PostgreSQL.
type PostgresDeviceRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresDeviceRepository creates a new PostgresDeviceRepository.
func NewPostgresDeviceRepository(pool *pgxpool.Pool) *PostgresDeviceRepository {
	return &PostgresDeviceRepository{pool: pool}
}

// Save inserts a new device into the database.
func (r *PostgresDeviceRepository) Save(ctx context.Context, device *domain.Device) error {
	query := `INSERT INTO devices (id, name, type, created_at) VALUES ($1, $2, $3, $4)`
	_, err := r.pool.Exec(ctx, query, device.ID, device.Name, device.Type, device.CreatedAt)
	if err != nil {
		return fmt.Errorf("save device: %w", err)
	}
	return nil
}

// FindAll returns all devices from the database.
func (r *PostgresDeviceRepository) FindAll(ctx context.Context) ([]*domain.Device, error) {
	query := `SELECT id, name, type, created_at FROM devices ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("find all devices: %w", err)
	}
	defer rows.Close()

	var devices []*domain.Device
	for rows.Next() {
		var d domain.Device
		if err := rows.Scan(&d.ID, &d.Name, &d.Type, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan device: %w", err)
		}
		devices = append(devices, &d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration: %w", err)
	}

	// Return empty slice, not nil, so JSON serialization gives [] not null
	if devices == nil {
		devices = []*domain.Device{}
	}
	return devices, nil
}

// FindByID returns a single device by ID, or ErrNotFound if it doesn't exist.
func (r *PostgresDeviceRepository) FindByID(ctx context.Context, id string) (*domain.Device, error) {
	query := `SELECT id, name, type, created_at FROM devices WHERE id = $1`
	var d domain.Device
	err := r.pool.QueryRow(ctx, query, id).Scan(&d.ID, &d.Name, &d.Type, &d.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, application.ErrNotFound
		}
		return nil, fmt.Errorf("find device by id: %w", err)
	}
	return &d, nil
}

// Update updates an existing device. Returns ErrNotFound if no rows were affected.
func (r *PostgresDeviceRepository) Update(ctx context.Context, device *domain.Device) error {
	query := `UPDATE devices SET name = $1, type = $2 WHERE id = $3`
	tag, err := r.pool.Exec(ctx, query, device.Name, device.Type, device.ID)
	if err != nil {
		return fmt.Errorf("update device: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return application.ErrNotFound
	}
	return nil
}

// Delete removes a device by ID. Returns ErrNotFound if no rows were affected.
func (r *PostgresDeviceRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM devices WHERE id = $1`
	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete device: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return application.ErrNotFound
	}
	return nil
}
