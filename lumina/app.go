package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"

	chatdomain "lumina/backend/chat/domain"
	chatinfra "lumina/backend/chat/infrastructure"
	treedomain "lumina/backend/projecttree/domain"
	treeinfra "lumina/backend/projecttree/infrastructure"
)

// App struct
type App struct {
	ctx  context.Context
	chat *chatdomain.Chat
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

	// Create chat instance with repomix integration
	chat := chatdomain.NewChat(openAIService, repomixService)

	return &App{
		chat: chat,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
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