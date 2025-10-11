import { Tool, ToolService } from '../domain/tool_service';
export declare class WailsToolService implements ToolService {
    saveTool(name: string, code: string): Promise<Tool>;
    listTools(): Promise<Tool[]>;
    getTool(id: string): Promise<Tool>;
}
