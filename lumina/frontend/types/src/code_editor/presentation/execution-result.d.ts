import { LitElement } from 'lit';
export interface Result {
    output: string;
    error: string;
    success: boolean;
    exitCode: number;
}
export declare class ExecutionResult extends LitElement {
    static styles: import("lit").CSSResult;
    result: Result | null;
    loading: boolean;
    render(): import("lit-html").TemplateResult<1>;
    private renderContent;
}
declare global {
    interface HTMLElementTagNameMap {
        'execution-result': ExecutionResult;
    }
}
