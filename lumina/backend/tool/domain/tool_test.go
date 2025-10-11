package domain_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"lumina/backend/tool/domain"
)

func TestTool_Creation(t *testing.T) {
	// When creating a new tool
	tool := domain.NewTool("My Tool", "console.log('hello world');")

	// Then it should have the expected properties
	assert.Equal(t, "My Tool", tool.Name)
	assert.Equal(t, "console.log('hello world');", tool.Code)
	assert.NotZero(t, tool.ID)
	assert.False(t, tool.CreatedAt.IsZero())
	assert.False(t, tool.UpdatedAt.IsZero())
}

func TestTool_Validation(t *testing.T) {
	testCases := []struct {
		name        string
		toolName    string
		code        string
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid tool",
			toolName:    "Test Tool",
			code:        "function test() { return true; }",
			expectError: false,
		},
		{
			name:        "empty name should fail",
			toolName:    "",
			code:        "function test() { return true; }",
			expectError: true,
			errorMsg:    "tool name cannot be empty",
		},
		{
			name:        "empty code should fail",
			toolName:    "Test Tool",
			code:        "",
			expectError: true,
			errorMsg:    "tool code cannot be empty",
		},
		{
			name:        "whitespace only name should fail",
			toolName:    "   ",
			code:        "function test() { return true; }",
			expectError: true,
			errorMsg:    "tool name cannot be empty",
		},
		{
			name:        "whitespace only code should fail",
			toolName:    "Test Tool",
			code:        "   ",
			expectError: true,
			errorMsg:    "tool code cannot be empty",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// When creating a tool with the given parameters
			tool, err := domain.NewToolWithValidation(tc.toolName, tc.code)

			if tc.expectError {
				// Then it should return an error
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tc.errorMsg)
				assert.Nil(t, tool)
			} else {
				// Then it should create the tool successfully
				assert.NoError(t, err)
				assert.NotNil(t, tool)
				assert.Equal(t, tc.toolName, tool.Name)
				assert.Equal(t, tc.code, tool.Code)
			}
		})
	}
}

func TestTool_UpdateTimestamp(t *testing.T) {
	// Given a tool
	originalTool := domain.NewTool("Original Name", "original code")
	originalUpdatedAt := originalTool.UpdatedAt

	// Wait a bit to ensure timestamp difference
	time.Sleep(1 * time.Millisecond)

	// When updating the tool
	updatedTool := originalTool.WithUpdatedCode("updated code")

	// Then the updated_at timestamp should be newer
	assert.True(t, updatedTool.UpdatedAt.After(originalUpdatedAt))
	assert.Equal(t, "Original Name", updatedTool.Name)
	assert.Equal(t, "updated code", updatedTool.Code)
	assert.Equal(t, originalTool.ID, updatedTool.ID)
	assert.Equal(t, originalTool.CreatedAt, updatedTool.CreatedAt)
}

func TestTool_Repository_Interface(t *testing.T) {
	// The repository interface should be properly defined
	var _ domain.ToolRepository = &MockToolRepository{}
}

// MockToolRepository for testing
type MockToolRepository struct {
	savedTools map[string]domain.Tool
	saveError  error
	getError   error
}

func NewMockToolRepository() *MockToolRepository {
	return &MockToolRepository{
		savedTools: make(map[string]domain.Tool),
	}
}

func (m *MockToolRepository) Save(tool domain.Tool) error {
	if m.saveError != nil {
		return m.saveError
	}
	m.savedTools[tool.ID] = tool
	return nil
}

func (m *MockToolRepository) GetByID(id string) (domain.Tool, error) {
	if m.getError != nil {
		return domain.Tool{}, m.getError
	}

	tool, exists := m.savedTools[id]
	if !exists {
		return domain.Tool{}, domain.ErrToolNotFound
	}
	return tool, nil
}

func (m *MockToolRepository) GetByName(name string) (domain.Tool, error) {
	if m.getError != nil {
		return domain.Tool{}, m.getError
	}

	for _, tool := range m.savedTools {
		if tool.Name == name {
			return tool, nil
		}
	}
	return domain.Tool{}, domain.ErrToolNotFound
}

func (m *MockToolRepository) List() ([]domain.Tool, error) {
	if m.getError != nil {
		return nil, m.getError
	}

	tools := make([]domain.Tool, 0, len(m.savedTools))
	for _, tool := range m.savedTools {
		tools = append(tools, tool)
	}
	return tools, nil
}

func (m *MockToolRepository) Close() error {
	// Mock implementation - nothing to close
	return nil
}