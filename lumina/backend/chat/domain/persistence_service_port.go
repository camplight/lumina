package domain

type PersistenceService interface {
	Load() ([]Message, error)
	Save(messages []Message) error
}