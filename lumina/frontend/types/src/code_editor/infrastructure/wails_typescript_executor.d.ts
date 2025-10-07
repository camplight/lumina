export interface ExecutionResult {
    output: string;
    error: string;
    success: boolean;
    exitCode: number;
}
export declare class WailsTypeScriptExecutor {
    execute(code: string): Promise<ExecutionResult>;
}
