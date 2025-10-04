import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { ChatService } from '../domain/chat_service';
import { ChatState, Message } from '../domain/chat_state';

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

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
      word-wrap: break-word;
    }

    /* Markdown styles */
    .content :is(h1, h2, h3, h4, h5, h6) {
      margin: 0.5em 0 0.3em 0;
      font-weight: 600;
    }

    .content h1 { font-size: 1.5em; }
    .content h2 { font-size: 1.3em; }
    .content h3 { font-size: 1.1em; }

    .content p {
      margin: 0.5em 0;
    }

    .content code {
      background: rgba(0, 0, 0, 0.1);
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .message.user .content code {
      background: rgba(255, 255, 255, 0.2);
    }

    .content pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0.5em 0;
    }

    .message.user .content pre {
      background: rgba(255, 255, 255, 0.1);
    }

    .content pre code {
      background: none;
      padding: 0;
    }

    .content ul, .content ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    .content li {
      margin: 0.25em 0;
    }

    .content blockquote {
      border-left: 3px solid rgba(0, 0, 0, 0.2);
      margin: 0.5em 0;
      padding-left: 1em;
      font-style: italic;
    }

    .message.user .content blockquote {
      border-left-color: rgba(255, 255, 255, 0.4);
    }

    .content a {
      color: #1976d2;
      text-decoration: underline;
    }

    .message.user .content a {
      color: #e3f2fd;
    }

    .content table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
    }

    .content th, .content td {
      border: 1px solid rgba(0, 0, 0, 0.2);
      padding: 6px 12px;
      text-align: left;
    }

    .content th {
      background: rgba(0, 0, 0, 0.05);
      font-weight: 600;
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

  private renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }

  private renderMessage(message: Message): TemplateResult {
    return html`
      <div class="message ${message.role}">
        <div class="role">${message.role}</div>
        <div class="content">
          ${unsafeHTML(this.renderMarkdown(message.content))}
        </div>
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