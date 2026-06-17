package main

import (
	"log/slog"
	"testing"
)

func TestParseLogLevel(t *testing.T) {
	tests := []struct {
		name  string
		level string
		want  slog.Level
	}{
		{"debug", "debug", slog.LevelDebug},
		{"info", "info", slog.LevelInfo},
		{"warn", "warn", slog.LevelWarn},
		{"error", "error", slog.LevelError},
		{"case insensitive", "DEBUG", slog.LevelDebug},
		{"mixed case", "Info", slog.LevelInfo},
		{"empty defaults to info", "", slog.LevelInfo},
		{"invalid defaults to info", "verbose", slog.LevelInfo},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseLogLevel(tt.level)
			if got != tt.want {
				t.Errorf("parseLogLevel(%q) = %d, want %d", tt.level, got, tt.want)
			}
		})
	}
}
