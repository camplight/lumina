package infrastructure_test

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"lumina/backend/tool/domain"
	"lumina/backend/tool/infrastructure"
)

func TestSQLiteToolRepository_SaveAndRetrieve(t *testing.T) {
	// Given a temporary database
	dbFile := "test_tools.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	// When saving a tool
	tool := domain.NewTool("Test Tool", "function hello() { return 'world'; }")
	err = repo.Save(tool)
	require.NoError(t, err)

	// Then it should be retrievable by ID
	retrieved, err := repo.GetByID(tool.ID)
	require.NoError(t, err)
	assert.Equal(t, tool.ID, retrieved.ID)
	assert.Equal(t, tool.Name, retrieved.Name)
	assert.Equal(t, tool.Code, retrieved.Code)
	assert.False(t, retrieved.CreatedAt.IsZero())
	assert.False(t, retrieved.UpdatedAt.IsZero())
}

func TestSQLiteToolRepository_GetByID_NotFound(t *testing.T) {
	// Given a temporary database
	dbFile := "test_tools_notfound.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	// When getting a non-existent tool
	_, err = repo.GetByID("non-existent-id")

	// Then it should return not found error
	assert.Error(t, err)
	assert.Equal(t, domain.ErrToolNotFound, err)
}

func TestSQLiteToolRepository_SaveAndRetrieveByName(t *testing.T) {
	// Given a temporary database
	dbFile := "test_tools_byname.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	// When saving a tool
	tool := domain.NewTool("Unique Tool", "console.log('unique');")
	err = repo.Save(tool)
	require.NoError(t, err)

	// Then it should be retrievable by name
	retrieved, err := repo.GetByName("Unique Tool")
	require.NoError(t, err)
	assert.Equal(t, tool.ID, retrieved.ID)
	assert.Equal(t, tool.Name, retrieved.Name)
	assert.Equal(t, tool.Code, retrieved.Code)
}

func TestSQLiteToolRepository_GetByName_NotFound(t *testing.T) {
	// Given a temporary database
	dbFile := "test_tools_byname_notfound.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	// When getting a non-existent tool by name
	_, err = repo.GetByName("Non-existent Tool")

	// Then it should return not found error
	assert.Error(t, err)
	assert.Equal(t, domain.ErrToolNotFound, err)
}

func TestSQLiteToolRepository_List(t *testing.T) {
	// Given a temporary database
	dbFile := "test_tools_list.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	// When saving multiple tools
	tool1 := domain.NewTool("Tool 1", "code1")
	tool2 := domain.NewTool("Tool 2", "code2")
	tool3 := domain.NewTool("Tool 3", "code3")

	err = repo.Save(tool1)
	require.NoError(t, err)
	err = repo.Save(tool2)
	require.NoError(t, err)
	err = repo.Save(tool3)
	require.NoError(t, err)

	// Then listing should return all tools
	tools, err := repo.List()
	require.NoError(t, err)
	assert.Len(t, tools, 3)

	// Verify all tools are present
	names := make(map[string]bool)
	for _, tool := range tools {
		names[tool.Name] = true
	}
	assert.True(t, names["Tool 1"])
	assert.True(t, names["Tool 2"])
	assert.True(t, names["Tool 3"])
}

func TestSQLiteToolRepository_List_Empty(t *testing.T) {
	// Given a temporary database
	dbFile := "test_tools_list_empty.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	// When listing tools in an empty database
	tools, err := repo.List()

	// Then it should return an empty list
	require.NoError(t, err)
	assert.Empty(t, tools)
}

func TestSQLiteToolRepository_UpdateExistingTool(t *testing.T) {
	// Given a temporary database with an existing tool
	dbFile := "test_tools_update.db"
	defer cleanupDatabase(dbFile)

	repo, err := infrastructure.NewSQLiteToolRepository(dbFile)
	require.NoError(t, err)
	defer repo.Close()

	originalTool := domain.NewTool("Update Test", "original code")
	err = repo.Save(originalTool)
	require.NoError(t, err)

	// When saving an updated version (same ID)
	updatedTool := originalTool.WithUpdatedCode("updated code")
	err = repo.Save(updatedTool)
	require.NoError(t, err)

	// Then the retrieved tool should have the updated code
	retrieved, err := repo.GetByID(originalTool.ID)
	require.NoError(t, err)
	assert.Equal(t, originalTool.ID, retrieved.ID)
	assert.Equal(t, originalTool.Name, retrieved.Name)
	assert.Equal(t, "updated code", retrieved.Code)
	assert.True(t, retrieved.UpdatedAt.After(originalTool.UpdatedAt))
}

func cleanupDatabase(dbFile string) {
	os.Remove(dbFile)
}