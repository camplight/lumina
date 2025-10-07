import { LitElement } from 'lit';
export interface ExecutionResult {
    output: string;
    error: string;
    success: boolean;
    exitCode: number;
}
export declare class ExecutionResult extends LitElement {
    static styles: import("lit").CSSResult;
    result: ExecutionResult | null;
    loading: boolean;
    render(): import("lit-html").TemplateResult<1>;
    private renderContent;
    setResult(result: ExecutionResult | null): void;
    setLoading(loading: boolean): void;
    clear(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'execution-result': ExecutionResult;
    }
}
