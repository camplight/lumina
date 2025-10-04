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

// Helper to recursively get all visible text including nested shadow DOMs
function getVisibleText(element: Element): string {
  const texts: string[] = [];

  function collectText(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        texts.push(text);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      // If element has shadow root, recurse into it
      if (el.shadowRoot) {
        Array.from(el.shadowRoot.childNodes).forEach(collectText);
      }
      // Also check regular children
      Array.from(el.childNodes).forEach(collectText);
    }
  }

  if (element.shadowRoot) {
    Array.from(element.shadowRoot.childNodes).forEach(collectText);
  }

  return texts.join(' ');
}

// Helper to check if text is visible anywhere in the component
function isTextVisible(element: Element, text: string): boolean {
  return getVisibleText(element).includes(text);
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
      <chat-interface .service=${mockService}></chat-interface>
    `);

    // When the user types a message and sends it
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;

    input.value = 'Hello AI';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;

    sendButton.click();
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 0));
    await el.updateComplete;

    // Then the user should see both their message and the assistant's response
    const visibleText = getVisibleText(el);
    expect(visibleText).toContain('Hello AI');
    expect(visibleText).toContain('Hello! How can I help you?');

    // And the input should be cleared
    expect(input.value).toBe('');
  });

  it('should display an error when the service fails', async () => {
    // Given a chat interface with a service that returns an error
    mockService.setMockError(new Error('API connection failed'));

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface>
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

    // Then the user should see an error message
    expect(isTextVisible(el, 'API connection failed')).toBe(true);
  });

  it('should not send empty messages', async () => {
    // Given a chat interface
    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface>
    `);

    const initialText = getVisibleText(el);

    // When the user tries to send an empty message
    const sendButton = el.shadowRoot!.querySelector('button') as HTMLButtonElement;
    sendButton.click();
    await el.updateComplete;

    // Then nothing should change (no new messages appear)
    expect(getVisibleText(el)).toBe(initialText);
  });

  it('should handle multiple message exchanges', async () => {
    // Given a chat interface
    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface>
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

    // Then the user should see all messages in order
    const visibleText = getVisibleText(el);
    expect(visibleText).toContain('First message');
    expect(visibleText).toContain('First response');
    expect(visibleText).toContain('Second message');
    expect(visibleText).toContain('Second response');
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
      <chat-interface .service=${slowService}></chat-interface>
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

    // Then the user should see a loading indicator
    expect(isTextVisible(el, 'Thinking')).toBe(true);

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
    expect(isTextVisible(el, 'Thinking')).toBe(false);

    // And the send button should be enabled again
    expect(sendButton.disabled).toBe(false);
  });

  it('should show empty state when no messages exist', async () => {
    // Given a chat interface with no messages
    mockService.setMockResponse({ messages: [] });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface>
    `);

    // Then the user should see an empty state message
    expect(isTextVisible(el, 'Start a conversation')).toBe(true);
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
      <chat-interface .service=${mockService}></chat-interface>
    `);

    await el.updateComplete;

    // Then the empty state should not be visible
    expect(isTextVisible(el, 'Start a conversation')).toBe(false);

    // And the user should see their conversation
    expect(isTextVisible(el, 'Hello')).toBe(true);
    expect(isTextVisible(el, 'Hi there!')).toBe(true);
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
      <chat-interface .service=${spyService}></chat-interface>
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

    // Then the message should be sent
    expect(sendMessageSpy).toHaveBeenCalledWith('Test via Enter');
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });

  it('should not send message when Shift+Enter is pressed', async () => {
    // Given a chat interface
    const sendMessageSpy = vi.fn();

    const spyService: ChatService = {
      sendMessage: sendMessageSpy,
      getState: async () => ({ messages: [] })
    };

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${spyService}></chat-interface>
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

    // Then the message should NOT be sent
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it('should show error when service is not provided', async () => {
    // Given a chat interface without a service
    const el = await fixture<ChatInterface>(html`
      <chat-interface></chat-interface>
    `);

    await el.updateComplete;

    // Then the user should see an error
    expect(isTextVisible(el, 'No chat service provided')).toBe(true);
  });

  it('should render markdown content correctly', async () => {
    // Given a chat interface with markdown content
    mockService.setMockResponse({
      messages: [
        { role: 'assistant', content: '# Heading\n\nThis is **bold** and *italic*.' }
      ]
    });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface>
    `);

    await el.updateComplete;

    // Then the user should see formatted content
    const visibleText = getVisibleText(el);
    expect(visibleText).toContain('Heading');
    expect(visibleText).toContain('This is bold and italic');
  });

  it('should render code blocks in markdown', async () => {
    // Given a chat interface with code block content
    mockService.setMockResponse({
      messages: [
        { role: 'assistant', content: '```javascript\nconst x = 42;\n```' }
      ]
    });

    const el = await fixture<ChatInterface>(html`
      <chat-interface .service=${mockService}></chat-interface>
    `);

    await el.updateComplete;

    // Then the user should see the code
    expect(isTextVisible(el, 'const x = 42')).toBe(true);
  });
});