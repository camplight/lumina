package domain

type ChatService interface {
	SendMessage(message string) (string, error)
}