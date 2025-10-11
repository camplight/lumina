export interface Tool {
    id: string;
    name: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ToolService {
    saveTool(name: string, code: string): Promise<Tool>;
    listTools(): Promise<Tool[]>;
    getTool(id: string): Promise<Tool>;
}
