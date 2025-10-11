import { LitElement } from 'lit';
export declare class CodeEditor extends LitElement {
    createRenderRoot(): this;
    code: string;
    private editor;
    firstUpdated(): Promise<void>;
    disconnectedCallback(): void;
    private initializeEditor;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'code-editor': CodeEditor;
    }
}
