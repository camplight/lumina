import { LitElement } from 'lit';
import './code_editor/presentation/code-editor';
import './code_editor/presentation/execution-result';
export declare class MainApp extends LitElement {
    static styles: import("lit").CSSResult;
    private isExecuting;
    private currentCode;
    private executionResult;
    private executor;
    render(): import("lit-html").TemplateResult<1>;
    private handleCodeChange;
    private executeCode;
}
declare global {
    interface HTMLElementTagNameMap {
        'main-app': MainApp;
    }
}
