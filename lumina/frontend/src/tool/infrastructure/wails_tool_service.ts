import { SaveTool } from '../../../wailsjs/go/main/App';
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
}