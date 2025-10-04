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
)

// App struct
type App struct {
	ctx         context.Context
	chat        *chatdomain.Chat
	persistence *chatinfra.SQLitePersistence
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

	// Create chat instance with repomix integration and persistence
	chat := chatdomain.NewChat(openAIService, repomixService, persistence)

	return &App{
		chat:        chat,
		persistence: persistence,
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