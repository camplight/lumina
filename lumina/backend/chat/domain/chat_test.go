package domain_test

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"lumina/backend/chat/domain"
)

// Mock implementation for testing (shared with repomix tests)
type MockChatService struct {
	response    string
	err         error
	lastMessage string
}

func (m *MockChatService) SendMessage(message string) (string, error) {
	m.lastMessage = message
	return m.response, m.err
}

var mockRepomix = &MockRepomixService{
    output: "test",
    err:    nil,
}

// Tests

func TestSendChatMessage_Success(t *testing.T) {
	// Given a chat service that returns a response
	mock := &MockChatService{
		response: "Hello! How can I help you?",
		err:      nil,
	}

    mockPersistence := &MockPersistenceService{}

	// When sending a message
	chat := domain.NewChat(mock, mockRepomix, mockPersistence)
	result, err := chat.SendMessage("Hi there")

	// Then it should return the response and update chat state
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Messages, 2) // user message + assistant response
	assert.Equal(t, "Hi there", result.Messages[0].Content)
	assert.Equal(t, "user", result.Messages[0].Role)
	assert.Equal(t, "Hello! How can I help you?", result.Messages[1].Content)
	assert.Equal(t, "assistant", result.Messages[1].Role)
}

func TestSendChatMessage_ServiceError(t *testing.T) {
	// Given a chat service that returns an error
	mock := &MockChatService{
		response: "",
		err:      errors.New("API error"),
	}

    mockPersistence := &MockPersistenceService{}

	// When sending a message
	chat := domain.NewChat(mock, mockRepomix, mockPersistence)
	result, err := chat.SendMessage("Hi there")

	// Then it should return the error and only store the user message
	assert.Error(t, err)
	assert.Equal(t, "API error", err.Error())
	assert.NotNil(t, result)
	assert.Len(t, result.Messages, 1) // only user message
	assert.Equal(t, "Hi there", result.Messages[0].Content)
	assert.Equal(t, "user", result.Messages[0].Role)
}

func TestSendChatMessage_EmptyMessage(t *testing.T) {
	// Given a chat service
	mock := &MockChatService{
		response: "I received an empty message",
		err:      nil,
	}

    mockPersistence := &MockPersistenceService{}

	// When sending an empty message
	chat := domain.NewChat(mock, mockRepomix, mockPersistence)
	result, err := chat.SendMessage("")

	// Then it should return an error without calling the service
	assert.Error(t, err)
	assert.Equal(t, "message cannot be empty", err.Error())
	assert.NotNil(t, result)
	assert.Empty(t, result.Messages)
}

func TestSendChatMessage_MultipleTurns(t *testing.T) {
	// Given a chat service
	mock := &MockChatService{
		response: "Response 1",
		err:      nil,
	}

    mockPersistence := &MockPersistenceService{}

	// When sending multiple messages
	chat := domain.NewChat(mock, mockRepomix, mockPersistence)

	result1, err := chat.SendMessage("Message 1")
	assert.NoError(t, err)
	assert.Len(t, result1.Messages, 2)

	mock.response = "Response 2"
	result2, err := chat.SendMessage("Message 2")
	assert.NoError(t, err)
	assert.Len(t, result2.Messages, 4)

	// Then it should maintain conversation history
	assert.Equal(t, "Message 1", result2.Messages[0].Content)
	assert.Equal(t, "Response 1", result2.Messages[1].Content)
	assert.Equal(t, "Message 2", result2.Messages[2].Content)
	assert.Equal(t, "Response 2", result2.Messages[3].Content)
}

func TestGetChatState_EmptyChat(t *testing.T) {
	// Given a new chat
	mock := &MockChatService{}
    mockPersistence := &MockPersistenceService{}
	chat := domain.NewChat(mock, mockRepomix, mockPersistence)

	// When getting the chat state
	state := chat.GetState()

	// Then it should return empty messages
	assert.NotNil(t, state)
	assert.Empty(t, state.Messages)
}

func TestGetChatState_WithMessages(t *testing.T) {
	// Given a chat with messages
	mock := &MockChatService{
		response: "AI response",
		err:      nil,
	}
    mockPersistence := &MockPersistenceService{}
	chat := domain.NewChat(mock, mockRepomix, mockPersistence)
	chat.SendMessage("User message")

	// When getting the chat state
	state := chat.GetState()

	// Then it should return all messages
	assert.NotNil(t, state)
	assert.Len(t, state.Messages, 2)
	assert.Equal(t, "User message", state.Messages[0].Content)
	assert.Equal(t, "AI response", state.Messages[1].Content)
}