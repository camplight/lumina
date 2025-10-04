export interface Message {
    role: string;
    content: string;
}
export interface ChatState {
    messages: Message[];
}
