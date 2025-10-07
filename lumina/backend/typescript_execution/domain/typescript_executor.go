package domain

// ExecutionResult represents the result of executing TypeScript code
type ExecutionResult struct {
	Output     string `json:"output"`
	Error      string `json:"error"`
	Success    bool   `json:"success"`
	ExitCode   int    `json:"exitCode"`
}

// TypeScriptExecutor defines the interface for executing TypeScript code
type TypeScriptExecutor interface {
	Execute(code string) (*ExecutionResult, error)
}