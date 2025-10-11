import { SaveTool, ListTools, GetTool } from '../../../wailsjs/go/main/App';
import { Tool, ToolService } from '../domain/tool_service';

export class WailsToolService implements ToolService {
  async saveTool(name: string, code: string): Promise<Tool> {
    const savedTool = await SaveTool(name, code);

    return {
      id: savedTool.id,
      name: savedTool.name,
      code: savedTool.code,
      createdAt: new Date(savedTool.created_at),
      updatedAt: new Date(savedTool.updated_at),
    };
  }

  async listTools(): Promise<Tool[]> {
    const tools = await ListTools();

    return tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      code: tool.code,
      createdAt: new Date(tool.created_at),
      updatedAt: new Date(tool.updated_at),
    }));
  }

  async getTool(id: string): Promise<Tool> {
    const tool = await GetTool(id);

    return {
      id: tool.id,
      name: tool.name,
      code: tool.code,
      createdAt: new Date(tool.created_at),
      updatedAt: new Date(tool.updated_at),
    };
  }
}