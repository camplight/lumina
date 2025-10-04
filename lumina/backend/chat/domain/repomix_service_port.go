package domain

// RepomixService generates a representation of the codebase
type RepomixService interface {
	GenerateOutput() (string, error)
}