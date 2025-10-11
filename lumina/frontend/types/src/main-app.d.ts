import { LitElement } from 'lit';
import './code_editor/presentation/code-editor';
import './code_editor/presentation/execution-result';
import './tool/presentation/tool-saver';
import './tool/presentation/tool-search';
export declare class MainApp extends LitElement {
    createRenderRoot(): this;
    connectedCallback(): void;
    private isExecuting;
    private currentCode;
    private executionResult;
    private selectedToolName;
    private executor;
    private toolService;
    render(): import("lit-html").TemplateResult<1>;
    private handleCodeChange;
    private handleToolSelected;
    private handleToolSaved;
    private executeCode;
}
declare global {
    interface HTMLElementTagNameMap {
        'main-app': MainApp;
    }
}
