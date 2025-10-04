import { ChatState } from './chat_state';
export interface ChatService {
    sendMessage(message: string): Promise<ChatState>;
    getState(): Promise<ChatState>;
}
