import { LitElement, TemplateResult } from 'lit';
import { Node } from '../domain/node';
export declare class ProjectTree extends LitElement {
    static styles: import("lit").CSSResult;
    private tree;
    private loading;
    private error;
    private expanded;
    private lister;
    connectedCallback(): void;
    loadTree(): Promise<void>;
    toggleNode(path: string): void;
    renderNode(node: Node, parentPath?: string): TemplateResult;
    render(): TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'project-tree': ProjectTree;
    }
}
