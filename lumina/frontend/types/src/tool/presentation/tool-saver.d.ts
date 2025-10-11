import { LitElement } from 'lit';
import { ToolService } from '../domain/tool_service';
export declare class ToolSaver extends LitElement {
    static styles: import("lit").CSSResult;
    private toolName;
    private isSaving;
    private saveMessage;
    code: string;
    toolService?: ToolService;
    private handleNameChange;
    private handleSave;
    private handleKeyPress;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'tool-saver': ToolSaver;
    }
}
