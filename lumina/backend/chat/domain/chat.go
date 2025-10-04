package domain

import (
	"errors"
	"fmt"
)

// Chat represents a chat session with message history
type Chat struct {
	service        ChatService
	repomixService RepomixService
	messages       []Message
}

// NewChat creates a new chat instance without repomix
func NewChat(service ChatService) *Chat {
	return &Chat{
		service:        service,
		repomixService: nil,
		messages:       make([]Message, 0),
	}
}

// NewChatWithRepomix creates a new chat instance with repomix integration
func NewChatWithRepomix(service ChatService, repomixService RepomixService) *Chat {
	return &Chat{
		service:        service,
		repomixService: repomixService,
		messages:       make([]Message, 0),
	}
}

// SendMessage sends a user message and receives an assistant response
func (c *Chat) SendMessage(message string) (ChatState, error) {
	// Validate message is not empty
	if message == "" {
		return c.GetState(), errors.New("message cannot be empty")
	}

	// Build the message to send
	messageToSend := message

	// If repomix is enabled, generate fresh context
	if c.repomixService != nil {
		codebaseContext, err := c.repomixService.GenerateOutput()
		if err != nil {
			return c.GetState(), fmt.Errorf("failed to generate codebase context: %w", err)
		}

		// Format the message with codebase context
		messageToSend = fmt.Sprintf(
			"Here is the current state of the codebase:\n\n%s\n\nUser question: %s",
			codebaseContext,
			message,
		)
	}

	// Add user message to history (original message, not the one with context)
	userMessage := Message{
		Role:    "user",
		Content: message,
	}
	c.messages = append(c.messages, userMessage)

	// Send to chat service (with context if repomix is enabled)
	response, err := c.service.SendMessage(messageToSend)
	if err != nil {
		// Return current state even on error (user message was added)
		return c.GetState(), err
	}

	// Add assistant response to history
	assistantMessage := Message{
		Role:    "assistant",
		Content: response,
	}
	c.messages = append(c.messages, assistantMessage)

	return c.GetState(), nil
}

// GetState returns the current chat state
func (c *Chat) GetState() ChatState {
	return ChatState{
		Messages: c.messages,
	}
}