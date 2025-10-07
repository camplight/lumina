package infrastructure

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	typescriptdomain "lumina/backend/typescript_execution/domain"
)

// NodeTypeScriptExecutor implements TypeScriptExecutor using Node.js
type NodeTypeScriptExecutor struct {
	tempDir string
}

// NewNodeTypeScriptExecutor creates a new Node-based TypeScript executor
func NewNodeTypeScriptExecutor() *NodeTypeScriptExecutor {
	tempDir, err := os.MkdirTemp("", "lumina-ts-exec-*")
	if err != nil {
		tempDir = os.TempDir()
	}

	return &NodeTypeScriptExecutor{
		tempDir: tempDir,
	}
}

// Execute compiles and runs TypeScript code using Node.js
func (e *NodeTypeScriptExecutor) Execute(code string) (*typescriptdomain.ExecutionResult, error) {
	// Create a temporary file for the TypeScript code
	tsFile := filepath.Join(e.tempDir, fmt.Sprintf("code_%d.ts", time.Now().UnixNano()))

	// Write the TypeScript code to the file
	err := os.WriteFile(tsFile, []byte(code), 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to write TypeScript file: %w", err)
	}
	defer os.Remove(tsFile)

	// Prepare the Node.js execution command
	// We'll use ts-node via npx to execute TypeScript directly
	cmd := exec.Command("npx", "ts-node", "--esm", tsFile)
	cmd.Dir = e.tempDir

	// Capture stdout and stderr
	var stdout, stderr strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Execute the command
	err = cmd.Run()

	// Prepare the result
	result := &typescriptdomain.ExecutionResult{
		Output:   stdout.String(),
		Error:    stderr.String(),
		ExitCode: 0,
	}

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitError.ExitCode()
		} else {
			result.Error = fmt.Sprintf("Execution error: %v\n%s", err, result.Error)
			result.ExitCode = 1
		}
		result.Success = false
	} else {
		result.Success = true
	}

	return result, nil
}

// Cleanup cleans up temporary files
func (e *NodeTypeScriptExecutor) Cleanup() {
	if e.tempDir != "" {
		os.RemoveAll(e.tempDir)
	}
}