package domain_test

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"lumina/backend/chat/domain"
)

// Mock RepomixService for testing
type MockRepomixService struct {
	output string
	err    error
}

func (m *MockRepomixService) GenerateOutput() (string, error) {
	return m.output, m.err
}

func TestSendChatMessage_WithRepomixContext(t *testing.T) {
	// Given a chat service and repomix service
	repomixOutput := "<file>test.go</file><content>package main</content>"
	mockRepomix := &MockRepomixService{
		output: repomixOutput,
		err:    nil,
	}

	mockChat := &MockChatService{
		response: "I can see your codebase!",
		err:      nil,
	}

    mockPersistence := &MockPersistenceService{}

	// When sending a message with repomix enabled
	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)
	result, err := chat.SendMessage("What's in my codebase?")

	// Then it should include the repomix output in the context
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, mockChat.lastMessage, repomixOutput)
	assert.Contains(t, mockChat.lastMessage, "What's in my codebase?")
}

func TestSendChatMessage_RepomixError(t *testing.T) {
	// Given a repomix service that fails
	mockRepomix := &MockRepomixService{
		output: "",
		err:    errors.New("repomix failed"),
	}

	mockChat := &MockChatService{
		response: "Hello!",
		err:      nil,
	}

    mockPersistence := &MockPersistenceService{}

	// When sending a message
	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)
	result, err := chat.SendMessage("Hello")

	// Then it should return the repomix error
	assert.Error(t, err)
	assert.Equal(t, "failed to generate codebase context: repomix failed", err.Error())
	assert.NotNil(t, result)
	assert.Empty(t, result.Messages)
}

func TestSendChatMessage_RepomixGeneratedOnEachMessage(t *testing.T) {
	// Given a repomix service that changes output
	callCount := 0
	mockRepomix := &MockRepomixService{
		output: "output-1",
		err:    nil,
	}

	mockChat := &MockChatService{
		response: "Response",
		err:      nil,
	}

    mockPersistence := &MockPersistenceService{}

	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// When sending first message
	chat.SendMessage("First")
	firstMessage := mockChat.lastMessage
	callCount++

	// And changing the repomix output
	mockRepomix.output = "output-2"

	// And sending second message
	chat.SendMessage("Second")
	secondMessage := mockChat.lastMessage

	// Then each message should have fresh repomix output
	assert.Contains(t, firstMessage, "output-1")
	assert.Contains(t, secondMessage, "output-2")
	assert.NotContains(t, secondMessage, "output-1")
}