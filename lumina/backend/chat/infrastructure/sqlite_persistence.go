package infrastructure

import (
	"database/sql"
	"fmt"
	"lumina/backend/chat/domain"

	_ "github.com/mattn/go-sqlite3"
)

type SQLitePersistence struct {
	db *sql.DB
}

func NewSQLitePersistence(dbPath string) (*SQLitePersistence, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Create messages table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		role TEXT NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`

	if _, err := db.Exec(createTableSQL); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create table: %w", err)
	}

	return &SQLitePersistence{db: db}, nil
}

func (s *SQLitePersistence) Load() ([]domain.Message, error) {
	rows, err := s.db.Query("SELECT role, content FROM messages ORDER BY id ASC")
	if err != nil {
		return nil, fmt.Errorf("failed to query messages: %w", err)
	}
	defer rows.Close()

	var messages []domain.Message
	for rows.Next() {
		var msg domain.Message
		if err := rows.Scan(&msg.Role, &msg.Content); err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating messages: %w", err)
	}

	return messages, nil
}

func (s *SQLitePersistence) Save(messages []domain.Message) error {
	// Start a transaction
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Clear existing messages
	if _, err := tx.Exec("DELETE FROM messages"); err != nil {
		return fmt.Errorf("failed to clear messages: %w", err)
	}

	// Insert all messages
	stmt, err := tx.Prepare("INSERT INTO messages (role, content) VALUES (?, ?)")
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, msg := range messages {
		if _, err := stmt.Exec(msg.Role, msg.Content); err != nil {
			return fmt.Errorf("failed to insert message: %w", err)
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (s *SQLitePersistence) Close() error {
	return s.db.Close()
}