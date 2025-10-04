package domain

import "errors"

// Chat represents a chat session with message history
type Chat struct {
	service  ChatService
	messages []Message
}

// NewChat creates a new chat instance
func NewChat(service ChatService) *Chat {
	return &Chat{
		service:  service,
		messages: make([]Message, 0),
	}
}

// SendMessage sends a user message and receives an assistant response
func (c *Chat) SendMessage(message string) (ChatState, error) {
	// Validate message is not empty
	if message == "" {
		return c.GetState(), errors.New("message cannot be empty")
	}

	// Add user message to history
	userMessage := Message{
		Role:    "user",
		Content: message,
	}
	c.messages = append(c.messages, userMessage)

	// Send to chat service
	response, err := c.service.SendMessage(message)
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