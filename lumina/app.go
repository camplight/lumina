package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"

	chatdomain "lumina/backend/chat/domain"
	chatinfra "lumina/backend/chat/infrastructure"
	treedomain "lumina/backend/projecttree/domain"
	treeinfra "lumina/backend/projecttree/infrastructure"
	tooldomain "lumina/backend/tool/domain"
	toolinfra "lumina/backend/tool/infrastructure"
	typescriptdomain "lumina/backend/typescript_execution/domain"
	typescriptinfra "lumina/backend/typescript_execution/infrastructure"
)

// App struct
type App struct {
	ctx                   context.Context
	chat                  *chatdomain.Chat
	persistence           *chatinfra.SQLitePersistence
	toolRepository        tooldomain.ToolRepository
	typescriptExecutor    typescriptdomain.TypeScriptExecutor
}

// NewApp creates a new App application struct
func NewApp() *App {
	// Load environment variables
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	// Get API key from environment
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Println("Warning: OPENAI_API_KEY not set in environment")
	}

	// Create OpenAI service
	openAIService := chatinfra.NewOpenAIService(apiKey)

	// Create repomix service (working directory is current directory)
	workingDir, err := os.Getwd()
	if err != nil {
		log.Printf("Warning: Could not get working directory: %v", err)
		workingDir = "."
	}
	repomixService := chatinfra.NewRepomixService(workingDir)

	// Create SQLite persistence
	// Store database in user's home directory or current directory
	dbPath := getDBPath()
	persistence, err := chatinfra.NewSQLitePersistence(dbPath)
	if err != nil {
		log.Printf("Warning: Could not initialize persistence: %v", err)
		persistence = nil
	} else {
		log.Printf("Chat persistence initialized at: %s", dbPath)
	}

	// Create tool repository using the same database
	var toolRepository tooldomain.ToolRepository
	if persistence != nil {
		toolRepo, err := toolinfra.NewSQLiteToolRepository(dbPath)
		if err != nil {
			log.Printf("Warning: Could not initialize tool repository: %v", err)
			toolRepository = nil
		} else {
			toolRepository = toolRepo
			log.Printf("Tool repository initialized at: %s", dbPath)
		}
	} else {
		toolRepository = nil
	}

	// Create chat instance with repomix integration and persistence
	chat := chatdomain.NewChat(openAIService, repomixService, persistence)

	// Create TypeScript executor
	typescriptExecutor := typescriptinfra.NewNodeTypeScriptExecutor()

	return &App{
		chat:            chat,
		persistence:     persistence,
		toolRepository:  toolRepository,
		typescriptExecutor: typescriptExecutor,
	}
}

// getDBPath returns the path for the SQLite database
func getDBPath() string {
	// Try to use a data directory in the user's home
	homeDir, err := os.UserHomeDir()
	if err == nil {
		dataDir := filepath.Join(homeDir, ".lumina")
		if err := os.MkdirAll(dataDir, 0755); err == nil {
			return filepath.Join(dataDir, "chat.db")
		}
	}

	// Fall back to current directory
	return "chat.db"
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	if a.persistence != nil {
		if err := a.persistence.Close(); err != nil {
			log.Printf("Warning: Failed to close persistence: %v", err)
		}
	}

	if a.toolRepository != nil {
		if err := a.toolRepository.Close(); err != nil {
			log.Printf("Warning: Failed to close tool repository: %v", err)
		}
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) GetCurrentProjectTree() (treedomain.Node, error) {
	lister := treeinfra.NewLister()
	return treedomain.ListDirectoryUseCase(lister, ".")
}

// SendChatMessage sends a message to the chat and returns the updated state
func (a *App) SendChatMessage(message string) (chatdomain.ChatState, error) {
	return a.chat.SendMessage(message)
}

// GetChatState returns the current chat state
func (a *App) GetChatState() chatdomain.ChatState {
	return a.chat.GetState()
}

// ExecuteTypeScript executes TypeScript code and returns the result
func (a *App) ExecuteTypeScript(code string) (typescriptdomain.ExecutionResult, error) {
	result, err := a.typescriptExecutor.Execute(code)
	if err != nil {
		return typescriptdomain.ExecutionResult{}, err
	}
	return *result, nil
}

// SaveTool saves a tool with the given name and code
func (a *App) SaveTool(name, code string) (tooldomain.Tool, error) {
	if a.toolRepository == nil {
		return tooldomain.Tool{}, fmt.Errorf("tool repository not available")
	}

	// Validate and create the tool
	tool, err := tooldomain.NewToolWithValidation(name, code)
	if err != nil {
		return tooldomain.Tool{}, fmt.Errorf("validation failed: %w", err)
	}

	// Save to repository
	err = a.toolRepository.Save(*tool)
	if err != nil {
		return tooldomain.Tool{}, fmt.Errorf("failed to save tool: %w", err)
	}

	return *tool, nil
}

// GetTool retrieves a tool by ID
func (a *App) GetTool(id string) (tooldomain.Tool, error) {
	if a.toolRepository == nil {
		return tooldomain.Tool{}, fmt.Errorf("tool repository not available")
	}

	return a.toolRepository.GetByID(id)
}

// GetToolByName retrieves a tool by name
func (a *App) GetToolByName(name string) (tooldomain.Tool, error) {
	if a.toolRepository == nil {
		return tooldomain.Tool{}, fmt.Errorf("tool repository not available")
	}

	return a.toolRepository.GetByName(name)
}

// ListTools returns all saved tools
func (a *App) ListTools() ([]tooldomain.Tool, error) {
	if a.toolRepository == nil {
		return nil, fmt.Errorf("tool repository not available")
	}

	return a.toolRepository.List()
}