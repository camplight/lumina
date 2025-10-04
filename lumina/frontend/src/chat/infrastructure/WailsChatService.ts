import { SendChatMessage, GetChatState } from '../../../wailsjs/go/main/App';
import { ChatService } from '../domain/chat_service';
import { ChatState } from '../domain/chat_state';

export class WailsChatService implements ChatService {
  async sendMessage(message: string): Promise<ChatState> {
    const result = await SendChatMessage(message);

    return {
      messages: result.messages || [],
    };
  }

  async getState(): Promise<ChatState> {
    const result = await GetChatState();

    return {
      messages: result.messages || [],
    };
  }
}