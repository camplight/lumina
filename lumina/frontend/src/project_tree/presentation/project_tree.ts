import {LitElement, html, css, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {getProjectTreeUseCase, ProjectTreeLister} from '../domain/project_tree_lister';
import { Node } from '../domain/node';

@customElement('project-tree')
export class Project_tree extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background-color: #1b2636;
      color: #e0e0e0;
    }

    .loading {
      color: #999;
    }

    .error {
      color: #ef5350;
      margin-bottom: 8px;
      background: rgba(239, 83, 80, 0.1);
      padding: 12px;
      border-radius: 4px;
    }

    button {
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }

    button:hover {
      background: #1565c0;
    }

    h2 {
      margin: 0 0 16px 0;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }

    .tree-node {
      user-select: none;
      cursor: pointer;
      padding: 6px 8px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      transition: background-color 0.15s ease;
    }

    .tree-node:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .icon {
      margin-right: 6px;
      color: #999;
      font-size: 14px;
      width: 16px;
      display: inline-block;
      text-align: center;
    }

    .name {
      font-weight: normal;
      font-size: 14px;
      color: #e0e0e0;
    }

    .name.directory {
      font-weight: 500;
      color: #fff;
    }

    .children {
      margin-left: 16px;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      padding-left: 4px;
    }
  `;

  // Injected dependency - the lister adapter
  @property({ attribute: false })
  lister!: ProjectTreeLister;

  @state()
  private tree: Node | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private expanded = new Set<string>();

  connectedCallback() {
    super.connectedCallback();

    if (!this.lister) {
      this.error = 'No lister provided';
      this.loading = false;
      return;
    }

    this.loadTree();
  }

  async loadTree() {
    try {
      this.loading = true;
      this.error = null;

      // Use the injected use case
      this.tree = await getProjectTreeUseCase(this.lister);

      // Auto-expand root
      if (this.tree) {
        this.expanded.add(this.tree.name);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load project tree';
      console.error('Error loading project tree:', err);
    } finally {
      this.loading = false;
    }
  }

  toggleNode(path: string) {
    if (this.expanded.has(path)) {
      this.expanded.delete(path);
    } else {
      this.expanded.add(path);
    }
    this.requestUpdate();
  }

  renderNode(node: Node, parentPath = ''): TemplateResult {
    const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isDirectory = node.type === 'directory';
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = this.expanded.has(nodePath);

    return html`
      <div>
        <div 
          class="tree-node"
          @click=${() => isDirectory && hasChildren && this.toggleNode(nodePath)}
        >
          <span class="icon">
            ${isDirectory && hasChildren
      ? isExpanded ? '▼' : '▶'
      : isDirectory ? '📁' : '📄'
    }
          </span>
          <span class="name ${isDirectory ? 'directory' : ''}">${node.name}</span>
        </div>
        
        ${isDirectory && hasChildren && isExpanded ? html`
          <div class="children">
            ${node.children.map(child => this.renderNode(child, nodePath))}
          </div>
        ` : ''}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading project structure...</div>`;
    }

    if (this.error) {
      return html`
        <div>
          <div class="error">Error: ${this.error}</div>
          <button @click=${this.loadTree}>Retry</button>
        </div>
      `;
    }

    if (!this.tree) {
      return html`<div>No project tree available</div>`;
    }

    return html`
      <div>
        <h2>Project Structure</h2>
        ${this.renderNode(this.tree)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'project-tree': Project_tree;
  }
}