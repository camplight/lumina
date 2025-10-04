import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { ChatService } from '../domain/chat_service';
import { ChatState, Message } from '../domain/chat_state';

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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    .messages-container::-webkit-scrollbar {
      width: 8px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px 20px;
      border-radius: 12px;
      max-width: 75%;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      text-align: left;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message.assistant {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.08);
      color: #e8eaed;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .role {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .content {
      font-size: 15px;
      line-height: 1.6;
      word-wrap: break-word;
    }

    .content :is(h1, h2, h3, h4, h5, h6) {
      margin: 0.8em 0 0.4em 0;
      font-weight: 600;
      line-height: 1.3;
    }

    .content h1 { font-size: 1.6em; }
    .content h2 { font-size: 1.4em; }
    .content h3 { font-size: 1.2em; }

    .content p {
      margin: 0.6em 0;
    }

    .content code {
      background: rgba(0, 0, 0, 0.3);
      padding: 3px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.9em;
    }

    .message.user .content code {
      background: rgba(255, 255, 255, 0.2);
    }

    .content pre {
      background: rgba(0, 0, 0, 0.4);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .message.user .content pre {
      background: rgba(0, 0, 0, 0.2);
    }

    .content pre code {
      background: none;
      padding: 0;
    }

    .content ul, .content ol {
      margin: 0.6em 0;
      padding-left: 1.5em;
    }

    .content li {
      margin: 0.3em 0;
    }

    .content blockquote {
      border-left: 3px solid rgba(255, 255, 255, 0.3);
      margin: 0.6em 0;
      padding-left: 1em;
      font-style: italic;
      opacity: 0.9;
    }

    .content a {
      color: #8ab4f8;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }

    .content a:hover {
      border-bottom-color: #8ab4f8;
    }

    .message.user .content a {
      color: #e3f2fd;
    }

    .input-container {
      display: flex;
      gap: 12px;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    input {
      flex: 1;
      padding: 14px 18px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      font-size: 15px;
      outline: none;
      background: rgba(255, 255, 255, 0.08);
      color: #e8eaed;
      transition: all 0.2s ease;
    }

    input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    input:focus {
      border-color: #667eea;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    button {
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      background: rgba(255, 255, 255, 0.1);
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.5;
    }

    .error {
      padding: 16px 20px;
      margin: 12px 24px;
      background: rgba(239, 83, 80, 0.15);
      color: #ff6b6b;
      border-radius: 10px;
      font-size: 14px;
      border: 1px solid rgba(239, 83, 80, 0.3);
      animation: slideIn 0.3s ease-out;
    }

    .loading {
      padding: 16px 20px;
      margin: 12px 24px;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 16px;
    }

    .empty-state-icon {
      font-size: 48px;
      opacity: 0.3;
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
      ? html`
            <div class="empty-state">
              <div class="empty-state-icon">💬</div>
              <div>Start a conversation...</div>
            </div>
          `
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