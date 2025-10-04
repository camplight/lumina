package domain

type Message struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"` // The message content
}

type ChatState struct {
	Messages []Message `json:"messages"`
}