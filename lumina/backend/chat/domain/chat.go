package domain

import (
	"errors"
	"fmt"
	"log"
)

type Chat struct {
	service            ChatService
	repomixService     RepomixService
	persistenceService PersistenceService
	messages           []Message
}

func NewChat(service ChatService, repomixService RepomixService, persistenceService PersistenceService) *Chat {
	chat := &Chat{
		service:            service,
		repomixService:     repomixService,
		persistenceService: persistenceService,
		messages:           make([]Message, 0),
	}

    messages, err := persistenceService.Load()
    if err != nil {
        log.Printf("Warning: Failed to load persisted messages: %v", err)
    } else {
        chat.messages = messages
    }

	return chat
}

func (c *Chat) SendMessage(message string) (ChatState, error) {
	if message == "" {
		return c.GetState(), errors.New("message cannot be empty")
	}

	messageToSend := message

	codebaseContext, err := c.repomixService.GenerateOutput()
	if err != nil {
		return c.GetState(), fmt.Errorf("failed to generate codebase context: %w", err)
	}

	messageToSend = fmt.Sprintf(
		"Here is the current state of the codebase:\n\n%s\n\nUser question: %s",
		codebaseContext,
		message,
	)

	userMessage := Message{
		Role:    "user",
		Content: message,
	}
	c.messages = append(c.messages, userMessage)

    if err := c.persistenceService.Save(c.messages); err != nil {
        log.Printf("Warning: Failed to persist user message: %v", err)
    }

	response, err := c.service.SendMessage(messageToSend)
	if err != nil {
		return c.GetState(), err
	}

	assistantMessage := Message{
		Role:    "assistant",
		Content: response,
	}
	c.messages = append(c.messages, assistantMessage)

    if err := c.persistenceService.Save(c.messages); err != nil {
        log.Printf("Warning: Failed to persist assistant message: %v", err)
    }

	return c.GetState(), nil
}

func (c *Chat) GetState() ChatState {
	return ChatState{
		Messages: c.messages,
	}
}