package domain_test

import (
	"testing"
	"github.com/stretchr/testify/assert"
	"lumina/projecttree/domain"
)

// Mock implementation for testing
type MockDirectoryLister struct {
	files []projecttree.FileInfo
	err   error
}

func (m *MockDirectoryLister) ListDirectory(path string) ([]projecttree.FileInfo, error) {
	return m.files, m.err
}

// Tests

func TestListDirectoryUseCase_EmptyDirectory(t *testing.T) {
	// Given an empty directory
	mock := &MockDirectoryLister{
		files: []projecttree.FileInfo{},
		err:   nil,
	}

	// When listing the directory
	result, err := projecttree.ListDirectoryUseCase(mock, "/empty")

	// Then it should return a directory node with no children
	assert.NoError(t, err)
	assert.Equal(t, "empty", result.Name)
	assert.Equal(t, "directory", result.Type)
	assert.Empty(t, result.Children)
}

func TestListDirectoryUseCase_DirectoryWithFiles(t *testing.T) {
	// Given a directory with two files
	mock := &MockDirectoryLister{
		files: []projecttree.FileInfo{
			{Path: "/project/README.md", IsDir: false, Children: nil},
			{Path: "/project/main.go", IsDir: false, Children: nil},
		},
		err: nil,
	}

	// When listing the directory
	result, err := projecttree.ListDirectoryUseCase(mock, "/project")

	// Then it should return a directory node with two file children
	assert.NoError(t, err)
	assert.Equal(t, "project", result.Name)
	assert.Equal(t, "directory", result.Type)
	assert.Len(t, result.Children, 2)

	assert.Equal(t, "README.md", result.Children[0].Name)
	assert.Equal(t, "file", result.Children[0].Type)
	assert.Empty(t, result.Children[0].Children)

	assert.Equal(t, "main.go", result.Children[1].Name)
	assert.Equal(t, "file", result.Children[1].Type)
	assert.Empty(t, result.Children[1].Children)
}

func TestListDirectoryUseCase_NestedDirectories(t *testing.T) {
	// Given a directory with subdirectories and files
	mock := &MockDirectoryLister{
		files: []projecttree.FileInfo{
			{
				Path:  "/project/src",
				IsDir: true,
				Children: []projecttree.FileInfo{
					{Path: "/project/src/app.go", IsDir: false, Children: nil},
					{Path: "/project/src/utils.go", IsDir: false, Children: nil},
				},
			},
			{Path: "/project/README.md", IsDir: false, Children: nil},
		},
		err: nil,
	}

	// When listing the directory
	result, err := projecttree.ListDirectoryUseCase(mock, "/project")

	// Then it should return a properly nested structure
	assert.NoError(t, err)
	assert.Equal(t, "project", result.Name)
	assert.Equal(t, "directory", result.Type)
	assert.Len(t, result.Children, 2)

	// Check subdirectory
	srcDir := result.Children[0]
	assert.Equal(t, "src", srcDir.Name)
	assert.Equal(t, "directory", srcDir.Type)
	assert.Len(t, srcDir.Children, 2)

	assert.Equal(t, "app.go", srcDir.Children[0].Name)
	assert.Equal(t, "file", srcDir.Children[0].Type)

	assert.Equal(t, "utils.go", srcDir.Children[1].Name)
	assert.Equal(t, "file", srcDir.Children[1].Type)

	// Check file at root level
	assert.Equal(t, "README.md", result.Children[1].Name)
	assert.Equal(t, "file", result.Children[1].Type)
}

func TestListDirectoryUseCase_DeepNesting(t *testing.T) {
	// Given a deeply nested directory structure
	mock := &MockDirectoryLister{
		files: []projecttree.FileInfo{
			{
				Path:  "/project/a",
				IsDir: true,
				Children: []projecttree.FileInfo{
					{
						Path:  "/project/a/b",
						IsDir: true,
						Children: []projecttree.FileInfo{
							{
								Path:  "/project/a/b/c",
								IsDir: true,
								Children: []projecttree.FileInfo{
									{Path: "/project/a/b/c/deep.txt", IsDir: false, Children: nil},
								},
							},
						},
					},
				},
			},
		},
		err: nil,
	}

	// When listing the directory
	result, err := projecttree.ListDirectoryUseCase(mock, "/project")

	// Then it should preserve the deep nesting
	assert.NoError(t, err)
	assert.Equal(t, "project", result.Name)

	// Navigate down the tree
	aNode := result.Children[0]
	assert.Equal(t, "a", aNode.Name)
	assert.Equal(t, "directory", aNode.Type)

	bNode := aNode.Children[0]
	assert.Equal(t, "b", bNode.Name)
	assert.Equal(t, "directory", bNode.Type)

	cNode := bNode.Children[0]
	assert.Equal(t, "c", cNode.Name)
	assert.Equal(t, "directory", cNode.Type)

	deepFile := cNode.Children[0]
	assert.Equal(t, "deep.txt", deepFile.Name)
	assert.Equal(t, "file", deepFile.Type)
	assert.Empty(t, deepFile.Children)
}

func TestListDirectoryUseCase_ListerError(t *testing.T) {
	// Given a lister that returns an error
	mock := &MockDirectoryLister{
		files: nil,
		err:   assert.AnError,
	}

	// When listing the directory
	result, err := projecttree.ListDirectoryUseCase(mock, "/project")

	// Then it should propagate the error
	assert.Error(t, err)
	assert.Equal(t, projecttree.Node{}, result)
}

func TestListDirectoryUseCase_ExtractsNameFromPath(t *testing.T) {
	// Given various path formats
	testCases := []struct {
		path         string
		expectedName string
	}{
		{"/project", "project"},
		{"/home/user/project", "project"},
		{"project", "project"},
		{"/project/", "project"},
		{"C:\\Users\\project", "project"},
	}

	for _, tc := range testCases {
		mock := &MockDirectoryLister{
			files: []projecttree.FileInfo{},
			err:   nil,
		}

		result, err := projecttree.ListDirectoryUseCase(mock, tc.path)

		assert.NoError(t, err)
		assert.Equal(t, tc.expectedName, result.Name, "Failed for path: %s", tc.path)
	}
}