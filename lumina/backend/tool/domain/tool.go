package domain

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrToolNameEmpty = errors.New("tool name cannot be empty")
	ErrToolCodeEmpty = errors.New("tool code cannot be empty")
	ErrToolNotFound  = errors.New("tool not found")
)

// Tool represents a saved piece of code with a name
type Tool struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NewTool creates a new tool with the given name and code
func NewTool(name, code string) Tool {
	now := time.Now()
	return Tool{
		ID:        uuid.New().String(),
		Name:      strings.TrimSpace(name),
		Code:      strings.TrimSpace(code),
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// NewToolWithValidation creates a new tool with validation
func NewToolWithValidation(name, code string) (*Tool, error) {
	trimmedName := strings.TrimSpace(name)
	trimmedCode := strings.TrimSpace(code)

	if trimmedName == "" {
		return nil, ErrToolNameEmpty
	}

	if trimmedCode == "" {
		return nil, ErrToolCodeEmpty
	}

	tool := NewTool(trimmedName, trimmedCode)
	return &tool, nil
}

// WithUpdatedCode returns a copy of the tool with updated code and timestamp
func (t Tool) WithUpdatedCode(newCode string) Tool {
	return Tool{
		ID:        t.ID,
		Name:      t.Name,
		Code:      strings.TrimSpace(newCode),
		CreatedAt: t.CreatedAt,
		UpdatedAt: time.Now(),
	}
}

// ToolRepository defines the interface for tool persistence operations
type ToolRepository interface {
	Save(tool Tool) error
	GetByID(id string) (Tool, error)
	GetByName(name string) (Tool, error)
	List() ([]Tool, error)
	Close() error
}