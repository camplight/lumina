import {ExecuteTypeScript} from '../../../wailsjs/go/main/App';

export interface ExecutionResult {
  output: string;
  error: string;
  success: boolean;
  exitCode: number;
}

export class WailsTypeScriptExecutor {
  async execute(code: string): Promise<ExecutionResult> {
    try {
      return await ExecuteTypeScript(code);
    } catch (error) {
      return {
        output: '',
        error: String(error),
        success: false,
        exitCode: 1
      };
    }
  }
}