import { LitElement } from 'lit';
import { ToolService, Tool } from '../domain/tool_service';
export declare class ToolSearch extends LitElement {
    static styles: import("lit").CSSResult;
    private searchQuery;
    private tools;
    private filteredTools;
    private isOpen;
    private isLoading;
    private selectedIndex;
    toolService?: ToolService;
    onToolSelected?: (tool: Tool) => void;
    private searchTimeout;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private loadTools;
    private handleInput;
    private filterTools;
    private handleKeyDown;
    private handleBlur;
    private selectTool;
    private closeDropdown;
    render(): import("lit-html").TemplateResult<1>;
    private renderDropdown;
}
declare global {
    interface HTMLElementTagNameMap {
        'tool-search': ToolSearch;
    }
}
