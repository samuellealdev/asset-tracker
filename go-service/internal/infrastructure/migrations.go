package infrastructure

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations creates the devices table if it doesn't exist.
// It is idempotent — safe to call on every startup.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	query := `
	CREATE TABLE IF NOT EXISTS devices (
		id UUID PRIMARY KEY,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		created_at TIMESTAMPTZ NOT NULL
	);`

	_, err := pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}
	return nil
}
