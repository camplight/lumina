import {customElement, state, property} from 'lit/decorators.js';
import {html, css, LitElement} from 'lit';
import { ToolService, Tool } from '../domain/tool_service';

@customElement('tool-search')
export class ToolSearch extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .toolSearch {
      padding: 12px 16px;
      background-color: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }

    .searchContainer {
      position: relative;
    }

    .searchInput {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: white;
      box-sizing: border-box;
    }

    .searchInput:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .searchInput::placeholder {
      color: #999;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
    }

    .dropdown.hidden {
      display: none;
    }

    .dropdownItem {
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdownItem:last-child {
      border-bottom: none;
    }

    .dropdownItem:hover {
      background-color: #f5f5f5;
    }

    .dropdownItem.selected {
      background-color: #e3f2fd;
    }

    .toolName {
      font-weight: 500;
      color: #333;
    }

    .toolDate {
      font-size: 12px;
      color: #666;
    }

    .loading {
      padding: 12px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }

    .noResults {
      padding: 12px;
      text-align: center;
      color: #666;
      font-size: 14px;
      font-style: italic;
    }

    .highlight {
      background-color: #ffeb3b;
      padding: 1px 2px;
      border-radius: 2px;
    }
  `;

  @state()
  private searchQuery = '';

  @state()
  private tools: Tool[] = [];

  @state()
  private filteredTools: Tool[] = [];

  @state()
  private isOpen = false;

  @state()
  private isLoading = false;

  @state()
  private selectedIndex = -1;

  @property({type: Object})
  toolService?: ToolService;

  @property({type: Function})
  onToolSelected?: (tool: Tool) => void;

  private searchTimeout: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.loadTools();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  private async loadTools() {
    if (!this.toolService) {
      return;
    }

    try {
      this.isLoading = true;
      this.tools = await this.toolService.listTools();
      this.filterTools();
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.selectedIndex = -1;
    this.isOpen = true;

    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.filterTools();
    }, 300);
  }

  private filterTools() {
    if (!this.searchQuery.trim()) {
      this.filteredTools = this.tools;
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredTools = this.tools.filter(tool =>
        tool.name.toLowerCase().includes(query)
      );
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isOpen) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredTools.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.filteredTools[this.selectedIndex]) {
          this.selectTool(this.filteredTools[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  private handleBlur() {
    // Small delay to allow click events to process
    setTimeout(() => {
      this.closeDropdown();
    }, 150);
  }

  private selectTool(tool: Tool) {
    this.searchQuery = tool.name;
    this.closeDropdown();

    // Dispatch custom event for tool selection
    this.dispatchEvent(new CustomEvent('tool-selected', {
      detail: { tool },
      bubbles: true
    }));

    // Call callback if provided
    if (this.onToolSelected) {
      this.onToolSelected(tool);
    }
  }

  private closeDropdown() {
    this.isOpen = false;
    this.selectedIndex = -1;
  }

  render() {
    return html`
      <div class="toolSearch">
        <div class="searchContainer">
          <input
            type="text"
            class="searchInput"
            placeholder="Search for tools..."
            .value=${this.searchQuery}
            @input=${this.handleInput}
            @keydown=${this.handleKeyDown}
            @blur=${this.handleBlur}
          />
          ${this.renderDropdown()}
        </div>
      </div>
    `;
  }

  private renderDropdown() {
    if (!this.isOpen) {
      return html`<div class="dropdown hidden"></div>`;
    }

    return html`
      <div class="dropdown">
        ${this.isLoading ? html`
          <div class="loading">Loading tools...</div>
        ` : this.filteredTools.length === 0 ? html`
          <div class="noResults">No tools found</div>
        ` : html`
          ${this.filteredTools.map((tool, index) => html`
            <div
              class="dropdownItem ${index === this.selectedIndex ? 'selected' : ''}"
              @click=${() => this.selectTool(tool)}
            >
              <span class="toolName">${tool.name}</span>
              <span class="toolDate">${new Date(tool.createdAt).toLocaleDateString()}</span>
            </div>
          `)}
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tool-search': ToolSearch;
  }
}