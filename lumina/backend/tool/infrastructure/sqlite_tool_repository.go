package infrastructure

import (
	"database/sql"
	"fmt"
	"time"

	"lumina/backend/tool/domain"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteToolRepository struct {
	db *sql.DB
}

func NewSQLiteToolRepository(dbPath string) (*SQLiteToolRepository, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Create tools table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS tools (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL UNIQUE,
		code TEXT NOT NULL,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);
	`

	if _, err := db.Exec(createTableSQL); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create tools table: %w", err)
	}

	return &SQLiteToolRepository{db: db}, nil
}

func (r *SQLiteToolRepository) Save(tool domain.Tool) error {
	// Start a transaction
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Use INSERT OR REPLACE to handle both create and update operations
	insertSQL := `
	INSERT OR REPLACE INTO tools (id, name, code, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?)
	`

	_, err = tx.Exec(insertSQL, tool.ID, tool.Name, tool.Code, tool.CreatedAt, tool.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to save tool: %w", err)
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *SQLiteToolRepository) GetByID(id string) (domain.Tool, error) {
	query := `
	SELECT id, name, code, created_at, updated_at
	FROM tools
	WHERE id = ?
	`

	var tool domain.Tool
	var createdAt, updatedAt time.Time

	err := r.db.QueryRow(query, id).Scan(
		&tool.ID,
		&tool.Name,
		&tool.Code,
		&createdAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return domain.Tool{}, domain.ErrToolNotFound
		}
		return domain.Tool{}, fmt.Errorf("failed to get tool by ID: %w", err)
	}

	tool.CreatedAt = createdAt
	tool.UpdatedAt = updatedAt

	return tool, nil
}

func (r *SQLiteToolRepository) GetByName(name string) (domain.Tool, error) {
	query := `
	SELECT id, name, code, created_at, updated_at
	FROM tools
	WHERE name = ?
	`

	var tool domain.Tool
	var createdAt, updatedAt time.Time

	err := r.db.QueryRow(query, name).Scan(
		&tool.ID,
		&tool.Name,
		&tool.Code,
		&createdAt,
		&updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return domain.Tool{}, domain.ErrToolNotFound
		}
		return domain.Tool{}, fmt.Errorf("failed to get tool by name: %w", err)
	}

	tool.CreatedAt = createdAt
	tool.UpdatedAt = updatedAt

	return tool, nil
}

func (r *SQLiteToolRepository) List() ([]domain.Tool, error) {
	query := `
	SELECT id, name, code, created_at, updated_at
	FROM tools
	ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list tools: %w", err)
	}
	defer rows.Close()

	var tools []domain.Tool
	for rows.Next() {
		var tool domain.Tool
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&tool.ID,
			&tool.Name,
			&tool.Code,
			&createdAt,
			&updatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan tool: %w", err)
		}

		tool.CreatedAt = createdAt
		tool.UpdatedAt = updatedAt

		tools = append(tools, tool)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tools: %w", err)
	}

	return tools, nil
}

func (r *SQLiteToolRepository) Close() error {
	return r.db.Close()
}