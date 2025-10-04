package infrastructure

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// RepomixService implements the RepomixService port
type RepomixService struct {
	workingDir string
	outputFile string
}

// NewRepomixService creates a new repomix service
func NewRepomixService(workingDir string) *RepomixService {
	return &RepomixService{
		workingDir: workingDir,
		outputFile: "repomix-output.xml",
	}
}

// GenerateOutput runs npx repomix and returns the output
func (r *RepomixService) GenerateOutput() (string, error) {
	// Build the command
	cmd := exec.Command("npx", "repomix", "-i", ".env")
	cmd.Dir = r.workingDir

	// Run the command
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to run repomix: %w (output: %s)", err, string(output))
	}

	// Read the generated file
	outputPath := filepath.Join(r.workingDir, r.outputFile)
	content, err := os.ReadFile(outputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read repomix output file: %w", err)
	}

	return string(content), nil
}