import { ChatService } from '../domain/chat_service';
import { ChatState } from '../domain/chat_state';
export declare class WailsChatService implements ChatService {
    sendMessage(message: string): Promise<ChatState>;
    getState(): Promise<ChatState>;
}
