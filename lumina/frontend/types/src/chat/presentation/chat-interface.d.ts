import { LitElement } from 'lit';
import { ChatService } from '../domain/chat_service';
import './chat-message';
export declare class ChatInterface extends LitElement {
    static styles: import("lit").CSSResult;
    service: ChatService;
    private chatState;
    private inputValue;
    private loading;
    private error;
    connectedCallback(): Promise<void>;
    private handleSendMessage;
    private handleKeyPress;
    private scrollToBottom;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'chat-interface': ChatInterface;
    }
}
