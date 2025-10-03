package domain

import (
	"path/filepath"
	"strings"
)

// ListDirectoryUseCase transforms adapter data to domain nodes
func ListDirectoryUseCase(lister DirectoryLister, path string) (Node, error) {
	// Get files from the adapter
	files, err := lister.ListDirectory(path)
	if err != nil {
		return Node{}, err
	}

	// Extract the directory name from the path
	dirName := extractName(path)

	// Build the root node
	rootNode := Node{
		Name:     dirName,
		Type:     "directory",
		Children: make([]Node, 0),
	}

	// Convert FileInfo entries to Nodes
	for _, file := range files {
		node := fileInfoToNode(file)
		rootNode.Children = append(rootNode.Children, node)
	}

	return rootNode, nil
}

// fileInfoToNode recursively converts FileInfo to Node
func fileInfoToNode(info FileInfo) Node {
	name := extractName(info.Path)
	nodeType := "file"
	if info.IsDir {
		nodeType = "directory"
	}

	node := Node{
		Name:     name,
		Type:     nodeType,
		Children: make([]Node, 0),
	}

	// Recursively process children
	if info.IsDir && len(info.Children) > 0 {
		for _, child := range info.Children {
			childNode := fileInfoToNode(child)
			node.Children = append(node.Children, childNode)
		}
	}

	return node
}

// extractName extracts the final component from a path
func extractName(path string) string {
	// Trim trailing slashes
	path = strings.TrimRight(path, "/\\")

	// Handle empty path
	if path == "" {
		return ""
	}

	// Normalize path separators to forward slashes for consistent handling
	// This allows us to handle both Unix and Windows paths regardless of OS
	normalizedPath := strings.ReplaceAll(path, "\\", "/")

	// Use filepath.Base to extract the last element from the normalized path
	name := filepath.Base(normalizedPath)

	// filepath.Base returns "." for empty paths, so handle that
	if name == "." {
		return ""
	}

	return name
}
