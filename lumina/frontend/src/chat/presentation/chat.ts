import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChatService } from '../domain/chat_service';
import { ChatState, Message } from '../domain/chat_state';

@customElement('chat-interface')
export class ChatInterface extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      border-radius: 8px;
      max-width: 80%;
      text-align: left;
    }

    .message.user {
      align-self: flex-end;
      background: #1976d2;
      color: white;
    }

    .message.assistant {
      align-self: flex-start;
      background: #f5f5f5;
      color: #333;
    }

    .role {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.8;
      text-transform: capitalize;
    }

    .content {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .input-container {
      display: flex;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: white;
    }

    input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
    }

    input:focus {
      border-color: #1976d2;
    }

    button {
      padding: 12px 24px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: #1565c0;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .error {
      padding: 12px;
      margin: 8px 16px;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
      font-size: 14px;
    }

    .loading {
      padding: 12px;
      margin: 8px 16px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 16px;
    }
  `;

  @property({ attribute: false })
  service!: ChatService;

  @state()
  private chatState: ChatState = { messages: [] };

  @state()
  private inputValue = '';

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  async connectedCallback() {
    super.connectedCallback();

    if (!this.service) {
      this.error = 'No chat service provided';
      return;
    }

    // Load initial state
    try {
      this.chatState = await this.service.getState();
    } catch (err) {
      console.error('Failed to load chat state:', err);
    }
  }

  private async handleSendMessage() {
    const message = this.inputValue.trim();

    if (!message) {
      return;
    }

    const messageCopy = message;
    this.inputValue = '';
    this.loading = true;
    this.error = null;

    try {
      this.chatState = await this.service.sendMessage(messageCopy);

      // Scroll to bottom after message is added
      await this.updateComplete;
      this.scrollToBottom();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error sending message:', err);
    } finally {
      this.loading = false;
    }
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage();
    }
  }

  private scrollToBottom() {
    const container = this.shadowRoot?.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  private renderMessage(message: Message): TemplateResult {
    return html`
      <div class="message ${message.role}">
        <div class="role">${message.role}</div>
        <div class="content">${message.content}</div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="messages-container">
        ${this.chatState.messages.length === 0 && !this.loading
      ? html`<div class="empty-state">Start a conversation...</div>`
      : this.chatState.messages.map(msg => this.renderMessage(msg))
    }
        ${this.loading ? html`<div class="loading">Thinking...</div>` : ''}
      </div>

      ${this.error ? html`<div class="error">${this.error}</div>` : ''}

      <div class="input-container">
        <input
          type="text"
          placeholder="Type your message..."
          .value=${this.inputValue}
          @input=${(e: Event) => this.inputValue = (e.target as HTMLInputElement).value}
          @keypress=${this.handleKeyPress}
          ?disabled=${this.loading}
        />
        <button
          @click=${this.handleSendMessage}
          ?disabled=${this.loading}
        >
          Send
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-interface': ChatInterface;
  }
}