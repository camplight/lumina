import {marked} from 'marked';
import {customElement, property} from 'lit/decorators.js';
import {css, html, LitElement} from 'lit';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {Message} from '../domain/chat_state';

marked.setOptions({
  breaks: true,
  gfm: true,
});

@customElement('chat-message')
export class ChatMessage extends LitElement {
  static styles = css`
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
  `;

  @property({ attribute: false })
  message!: Message;

  private renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }

  render() {
    return html`
      <div class="message ${this.message.role}">
        <div class="role">${this.message.role}</div>
        <div class="content">
          ${unsafeHTML(this.renderMarkdown(this.message.content))}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-message': ChatMessage;
  }
}
