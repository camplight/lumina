import { LitElement, TemplateResult } from 'lit';
import { ProjectTreeLister } from '../domain/project_tree_lister';
import { Node } from '../domain/node';
export declare class ProjectTree extends LitElement {
    static styles: import("lit").CSSResult;
    lister: ProjectTreeLister;
    private tree;
    private loading;
    private error;
    private expanded;
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
