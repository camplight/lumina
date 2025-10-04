package infrastructure

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

type OpenAIService struct {
	apiKey     string
	httpClient *http.Client
}

type openAIRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	Choices []struct {
		Message openAIMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

func NewOpenAIService(apiKey string) *OpenAIService {
	return &OpenAIService{
		apiKey:     apiKey,
		httpClient: &http.Client{},
	}
}

func (s *OpenAIService) SendMessage(message string) (string, error) {
	if s.apiKey == "" {
		return "", errors.New("OpenAI API key is not set")
	}

	reqBody := openAIRequest{
		Model: "gpt-4.1",
		Messages: []openAIMessage{
			{
				Role:    "user",
				Content: message,
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if openAIResp.Error != nil {
		return "", fmt.Errorf("OpenAI API error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return "", errors.New("no response from OpenAI")
	}

	return openAIResp.Choices[0].Message.Content, nil
}