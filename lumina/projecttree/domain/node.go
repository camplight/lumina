package domain

type Node struct {
	Name     string `json:"name"`
	Type     string `json:"type"` // "directory" or "file"
	Children []Node `json:"children"`
}
