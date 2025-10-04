package domain_test

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"lumina/backend/chat/domain"
)

type MockPersistenceService struct {
	savedMessages []domain.Message
	loadError     error
	saveError     error
	saveCalls     [][]domain.Message
}

func (m *MockPersistenceService) Load() ([]domain.Message, error) {
	if m.loadError != nil {
		return nil, m.loadError
	}
	return m.savedMessages, nil
}

func (m *MockPersistenceService) Save(messages []domain.Message) error {
	if m.saveCalls == nil {
		m.saveCalls = make([][]domain.Message, 0)
	}
	// Deep copy to capture the state at this moment
	messageCopy := make([]domain.Message, len(messages))
	copy(messageCopy, messages)
	m.saveCalls = append(m.saveCalls, messageCopy)

	if m.saveError != nil {
		return m.saveError
	}
	m.savedMessages = messages
	return nil
}

func TestSendChatMessage_PersistsUserMessageImmediately(t *testing.T) {
	// Given a chat with persistence
	mockChat := &MockChatService{
		response: "AI response",
		err:      nil,
	}
	mockPersistence := &MockPersistenceService{}

	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// When sending a message
	_, err := chat.SendMessage("User question")

	// Then the user message should be persisted before getting AI response
	assert.NoError(t, err)
	assert.NotNil(t, mockPersistence.saveCalls)
	assert.GreaterOrEqual(t, len(mockPersistence.saveCalls), 1, "Should have at least one save call")

	// First save should contain only the user message
	firstSave := mockPersistence.saveCalls[0]
	assert.Len(t, firstSave, 1)
	assert.Equal(t, "user", firstSave[0].Role)
	assert.Equal(t, "User question", firstSave[0].Content)
}

func TestSendChatMessage_PersistsAssistantResponseImmediately(t *testing.T) {
	// Given a chat with persistence
	mockChat := &MockChatService{
		response: "AI response",
		err:      nil,
	}
	mockPersistence := &MockPersistenceService{}

	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// When sending a message
	_, err := chat.SendMessage("User question")

	// Then the assistant response should be persisted after receiving it
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(mockPersistence.saveCalls), 2, "Should have at least two save calls")

	// Second save should contain both user message and assistant response
	secondSave := mockPersistence.saveCalls[1]
	assert.Len(t, secondSave, 2)
	assert.Equal(t, "user", secondSave[0].Role)
	assert.Equal(t, "User question", secondSave[0].Content)
	assert.Equal(t, "assistant", secondSave[1].Role)
	assert.Equal(t, "AI response", secondSave[1].Content)
}

func TestChat_LoadsExistingMessagesWhenPersistenceSet(t *testing.T) {
	// Given existing persisted messages
	existingMessages := []domain.Message{
		{Role: "user", Content: "Previous question"},
		{Role: "assistant", Content: "Previous answer"},
	}
	mockPersistence := &MockPersistenceService{
		savedMessages: existingMessages,
	}
	mockChat := &MockChatService{}

	// When creating a new chat and setting persistence
	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// Then the chat should have the persisted messages
	state := chat.GetState()
	assert.Len(t, state.Messages, 2)
	assert.Equal(t, "Previous question", state.Messages[0].Content)
	assert.Equal(t, "Previous answer", state.Messages[1].Content)
}

func TestChat_StartsEmptyWhenNoPersistence(t *testing.T) {
	// Given no persisted messages
	mockPersistence := &MockPersistenceService{
		savedMessages: []domain.Message{},
	}
	mockChat := &MockChatService{}

	// When creating a new chat and setting persistence
	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// Then the chat should be empty
	state := chat.GetState()
	assert.Empty(t, state.Messages)
}

func TestSendChatMessage_ContinuesWhenPersistenceFails(t *testing.T) {
	// Given a chat where persistence fails
	mockChat := &MockChatService{
		response: "AI response",
		err:      nil,
	}
	mockPersistence := &MockPersistenceService{
		saveError: errors.New("disk full"),
	}

	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// When sending a message
	result, err := chat.SendMessage("User question")

	// Then the message should still be processed successfully
	assert.NoError(t, err, "Should not return error even if persistence fails")
	assert.Len(t, result.Messages, 2)
	assert.Equal(t, "User question", result.Messages[0].Content)
	assert.Equal(t, "AI response", result.Messages[1].Content)
}

func TestChat_HandlesLoadError(t *testing.T) {
	// Given a persistence service that fails to load
	mockPersistence := &MockPersistenceService{
		loadError: errors.New("corrupted data"),
	}
	mockChat := &MockChatService{}

	// When setting persistence on a chat
	chat := domain.NewChat(mockChat, mockRepomix, mockPersistence)

	// Then the chat should be created with empty state (failed load is logged but not fatal)
	state := chat.GetState()
	assert.Empty(t, state.Messages, "Chat should start empty when load fails")
}