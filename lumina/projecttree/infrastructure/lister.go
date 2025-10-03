package filesystem

import (
	"io/fs"
	"os"
	"path/filepath"
	"lumina/projecttree/domain"
)

// Lister implements the DirectoryLister port using the OS filesystem
type Lister struct{}

// NewLister creates a new filesystem lister
func NewLister() *Lister {
	return &Lister{}
}

// ListDirectory reads a directory from the filesystem and returns FileInfo entries
func (l *Lister) ListDirectory(path string) ([]projecttree.FileInfo, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var files []projecttree.FileInfo

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())
		fileInfo := projecttree.FileInfo{
			Path:     fullPath,
			IsDir:    entry.IsDir(),
			Children: nil,
		}

		// Recursively read subdirectories
		if entry.IsDir() {
			children, err := l.ListDirectory(fullPath)
			if err != nil {
				// Skip directories we can't read (permissions, etc.)
				continue
			}
			fileInfo.Children = children
		}

		files = append(files, fileInfo)
	}

	return files, nil
}

// ListDirectoryShallow reads only the immediate children (non-recursive)
func (l *Lister) ListDirectoryShallow(path string) ([]projecttree.FileInfo, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	var files []projecttree.FileInfo

	for _, entry := range entries {
		fullPath := filepath.Join(path, entry.Name())
		fileInfo := projecttree.FileInfo{
			Path:     fullPath,
			IsDir:    entry.IsDir(),
			Children: nil,
		}

		files = append(files, fileInfo)
	}

	return files, nil
}