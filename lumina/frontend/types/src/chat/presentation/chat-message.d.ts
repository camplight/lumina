import { LitElement } from 'lit';
import { Message } from '../domain/chat_state';
export declare class ChatMessage extends LitElement {
    static styles: import("lit").CSSResult;
    message: Message;
    private renderMarkdown;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'chat-message': ChatMessage;
    }
}
