import { LitElement } from 'lit';
export declare class CodeEditor extends LitElement {
    static styles: import("lit").CSSResult;
    code: string;
    private editor;
    firstUpdated(): Promise<void>;
    disconnectedCallback(): void;
    private initializeEditor;
    updated(changedProperties: Map<string, any>): void;
    render(): import("lit-html").TemplateResult<1>;
    getCode(): string;
    setCode(code: string): void;
    focus(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'code-editor': CodeEditor;
    }
}
