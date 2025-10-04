import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import './chat-interface';
import { ChatInterface } from './chat-interface';
import { ChatService } from '../domain/chat_service';
import { ChatState } from '../domain/chat_state';

class MockChatService implements ChatService {
  private mockResponse: ChatState | null = null;
  private mockError: Error | null = null;

  setMockResponse(response: ChatState) {
    this.mockResponse = response;
    this.mockError = null;
  }

  setMockError(error: Error) {
    this.mockError = error;
    this.mockResponse = null;
  }

  async sendMessage(_message: string): Promise<ChatState> {
    if (this.mockError) {
      throw this.mockError;
    }
    return this.mockResponse!;
  }

  async getState(): Promise<ChatState> {
    if (this.mockResponse) {
      return this.mockResponse;
    }
    return { messages: [] };
  }
}

describe('ChatInterface Acceptance Tests', () => {
  let mockService: MockChatService;

  beforeEach(() => {
    mockService = new MockChatService();
  });

  it('should send a message and display the response', async () => {
    // Given a chat interface with a service that returns a response
    mockService.setMockResponse({
      messages: [
        { role: 'user', content: 'Hello AI' },
        { role: 'assistant', content: 'Hello! How can I help you?' }
      ]
    });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    // When the user types a message and sends it
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;

    expect(input).toBeTruthy();
    expect(sendButton).toBeTruthy();

    input.value = 'Hello AI';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    sendButton.click();
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then both the user message and assistant response should be displayed
    const messages = el.shadowRoot!.querySelectorAll('.message');
    expect(messages.length).toBe(2);

    const userMessage = messages[0];
    expect(userMessage.querySelector('.role')?.textContent).toContain('user');
    // Check for the content text (ignoring HTML markup)
    expect(userMessage.querySelector('.content')?.textContent?.trim()).toBe('Hello AI');

    const assistantMessage = messages[1];
    expect(assistantMessage.querySelector('.role')?.textContent).toContain('assistant');
    expect(assistantMessage.querySelector('.content')?.textContent?.trim()).toBe('Hello! How can I help you?');

    // And the input should be cleared
    expect(input.value).toBe('');
  });

  it('should display an error when the service fails', async () => {
    // Given a chat interface with a service that returns an error
    mockService.setMockError(new Error('API connection failed'));

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    // When the user tries to send a message
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;

    input.value = 'Hello AI';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    sendButton.click();
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then an error message should be displayed
    const errorElement = el.shadowRoot!.querySelector('.error');
    expect(errorElement).toBeTruthy();
    expect(errorElement!.textContent).toContain('API connection failed');
  });

  it('should not send empty messages', async () => {
    // Given a chat interface
    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    // When the user tries to send an empty message
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;

    input.value = '';
    sendButton.click();
    await el.updateComplete;

    // Then no messages should be displayed
    const messages = el.shadowRoot!.querySelectorAll('.message');
    expect(messages.length).toBe(0);
  });

  it('should handle multiple message exchanges', async () => {
    // Given a chat interface
    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;

    // When the user sends multiple messages
    mockService.setMockResponse({
      messages: [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' }
      ]
    });

    input.value = 'First message';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    sendButton.click();
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    mockService.setMockResponse({
      messages: [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second message' },
        { role: 'assistant', content: 'Second response' }
      ]
    });

    input.value = 'Second message';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    sendButton.click();
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then all messages should be displayed in order
    const messages = el.shadowRoot!.querySelectorAll('.message');
    expect(messages.length).toBe(4);

    expect(messages[0].querySelector('.content')?.textContent?.trim()).toBe('First message');
    expect(messages[1].querySelector('.content')?.textContent?.trim()).toBe('First response');
    expect(messages[2].querySelector('.content')?.textContent?.trim()).toBe('Second message');
    expect(messages[3].querySelector('.content')?.textContent?.trim()).toBe('Second response');
  });

  it('should show loading state while waiting for response', async () => {
    // Given a chat interface with a slow service
    let resolvePromise: (value: ChatState) => void;
    const slowService: ChatService = {
      sendMessage: () => new Promise<ChatState>((resolve) => {
        resolvePromise = resolve;
      }),
      getState: async () => ({ messages: [] })
    };

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${slowService}></chat-interface >
    `);

    // When the user sends a message
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;

    input.value = 'Test message';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    sendButton.click();
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then a loading indicator should be visible
    const loadingIndicator = el.shadowRoot!.querySelector('.loading');
    expect(loadingIndicator).toBeTruthy();

    // And the send button should be disabled
    expect(sendButton.disabled).toBe(true);

    // When the response arrives
    resolvePromise!({
      messages: [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Response' }
      ]
    });
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then the loading indicator should be hidden
    const loadingAfter = el.shadowRoot!.querySelector('.loading');
    expect(loadingAfter).toBeFalsy();

    // And the send button should be enabled again
    expect(sendButton.disabled).toBe(false);
  });

  it('should show empty state when no messages exist', async () => {
    // Given a chat interface with no messages
    mockService.setMockResponse({ messages: [] });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    // Then it should show an empty state message
    const emptyState = el.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState!.textContent).toContain('Start a conversation');
  });

  it('should hide empty state when messages exist', async () => {
    // Given a chat interface with messages
    mockService.setMockResponse({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
    });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    await el.updateComplete;

    // Then the empty state should not be visible
    const emptyState = el.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeFalsy();

    // And messages should be displayed
    const messages = el.shadowRoot!.querySelectorAll('.message');
    expect(messages.length).toBe(2);
  });

  it('should send message when Enter key is pressed', async () => {
    // Given a chat interface
    const sendMessageSpy = vi.fn().mockResolvedValue({
      messages: [
        { role: 'user', content: 'Test via Enter' },
        { role: 'assistant', content: 'Response' }
      ]
    });

    const spyService: ChatService = {
      sendMessage: sendMessageSpy,
      getState: async () => ({ messages: [] })
    };

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${spyService}></chat-interface >
    `);

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;

    // When the user types and presses Enter
    input.value = 'Test via Enter';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    const enterEvent = new KeyboardEvent('keypress', {
      key: 'Enter',
      shiftKey: false,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(enterEvent);

    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then sendMessage should have been called
    expect(sendMessageSpy).toHaveBeenCalledWith('Test via Enter');
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);

    // And the event should have had preventDefault called
    expect(enterEvent.defaultPrevented).toBe(true);
  });

  it('should not send message when Shift+Enter is pressed', async () => {
    // Given a chat interface
    const sendMessageSpy = vi.fn();

    const spyService: ChatService = {
      sendMessage: sendMessageSpy,
      getState: async () => ({ messages: [] })
    };

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${spyService}></chat-interface >
    `);

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;

    // When the user types and presses Shift+Enter
    input.value = 'Test';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    const shiftEnterEvent = new KeyboardEvent('keypress', {
      key: 'Enter',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(shiftEnterEvent);

    await el.updateComplete;

    // Then sendMessage should NOT have been called
    expect(sendMessageSpy).not.toHaveBeenCalled();

    // And preventDefault should NOT have been called
    expect(shiftEnterEvent.defaultPrevented).toBe(false);
  });

  it('should show error when service is not provided', async () => {
    // Given a chat interface without a service
    const el = await fixture<ChatInterface>(html`
      <chat-interface></chat-interface >
    `);

    await el.updateComplete;

    // Then an error should be displayed
    const error = el.shadowRoot!.querySelector('.error');
    expect(error).toBeTruthy();
    expect(error!.textContent).toContain('No chat service provided');
  });

  it('should render markdown content correctly', async () => {
    // Given a chat interface with markdown content
    mockService.setMockResponse({
      messages: [
        { role: 'assistant', content: '# Heading\n\nThis is **bold** and *italic*.' }
      ]
    });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    await el.updateComplete;

    // Then the markdown should be rendered as HTML
    const content = el.shadowRoot!.querySelector('.content');
    expect(content).toBeTruthy();

    // Check for heading
    expect(content!.querySelector('h1')).toBeTruthy();
    expect(content!.querySelector('h1')?.textContent?.trim()).toBe('Heading');

    // Check for bold and italic
    expect(content!.querySelector('strong')).toBeTruthy();
    expect(content!.querySelector('em')).toBeTruthy();
  });

  it('should render code blocks in markdown', async () => {
    // Given a chat interface with code block content
    mockService.setMockResponse({
      messages: [
        { role: 'assistant', content: '```javascript\nconst x = 42;\n```' }
      ]
    });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface >
    `);

    await el.updateComplete;

    // Then code blocks should be rendered
    const content = el.shadowRoot!.querySelector('.content');
    expect(content).toBeTruthy();
    expect(content!.querySelector('pre')).toBeTruthy();
    expect(content!.querySelector('code')).toBeTruthy();
  });
});