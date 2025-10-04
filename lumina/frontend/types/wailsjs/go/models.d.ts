export declare namespace domain {
    class Message {
        role: string;
        content: string;
        static createFrom(source?: any): Message;
        constructor(source?: any);
    }
    class ChatState {
        messages: Message[];
        static createFrom(source?: any): ChatState;
        constructor(source?: any);
        convertValues(a: any, classs: any, asMap?: boolean): any;
    }
    class Node {
        name: string;
        type: string;
        children: Node[];
        static createFrom(source?: any): Node;
        constructor(source?: any);
        convertValues(a: any, classs: any, asMap?: boolean): any;
    }
}
