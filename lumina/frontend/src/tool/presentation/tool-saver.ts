import {customElement, state, property} from 'lit/decorators.js';
import {html, css, LitElement} from 'lit';
import { ToolService } from '../domain/tool_service';

@customElement('tool-saver')
export class ToolSaver extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .toolSaver {
      padding: 16px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .inputRow {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .toolNameInput {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: white;
    }

    .toolNameInput:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .toolNameInput:disabled {
      background-color: #f9f9f9;
      color: #666;
    }

    .saveButton {
      padding: 8px 16px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      white-space: nowrap;
    }

    .saveButton:hover:not(:disabled) {
      background-color: #1565c0;
    }

    .saveButton:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .saveMessage {
      margin-top: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
    }

    .saveMessage.success {
      background-color: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }

    .saveMessage.error {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }
  `;

  @state()
  private toolName = '';

  @state()
  private isSaving = false;

  @state()
  private saveMessage = '';

  @property({type: String})
  code = '';

  @property({type: Object})
  toolService?: ToolService;

  private handleNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.toolName = target.value;
    this.saveMessage = '';
  }

  private async handleSave() {
    if (!this.toolName.trim()) {
      this.saveMessage = 'Please enter a tool name';
      return;
    }

    if (!this.code.trim()) {
      this.saveMessage = 'Cannot save an empty tool';
      return;
    }

    if (!this.toolService) {
      this.saveMessage = 'Error: Tool service not available';
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';

    try {
      const savedTool = await this.toolService.saveTool(this.toolName.trim(), this.code.trim());
      this.saveMessage = `Tool "${savedTool.name}" saved successfully!`;
      this.toolName = '';

      // Dispatch event to notify parent of successful save
      this.dispatchEvent(new CustomEvent('tool-saved', {
        detail: {tool: savedTool},
        bubbles: true
      }));
    } catch (error) {
      this.saveMessage = `Error: ${String(error)}`;
    } finally {
      this.isSaving = false;
    }
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.handleSave();
    }
  }

  render() {
    return html`
      <div class="toolSaver">
        <div class="inputRow">
          <input
            type="text"
            class="toolNameInput"
            placeholder="Enter tool name..."
            .value=${this.toolName}
            @input=${this.handleNameChange}
            @keypress=${this.handleKeyPress}
            ?disabled=${this.isSaving}
          />
          <button
            class="saveButton"
            ?disabled=${this.isSaving || !this.toolName.trim() || !this.code.trim()}
            @click=${this.handleSave}
          >
            ${this.isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        ${this.saveMessage ? html`
          <div class="saveMessage ${this.saveMessage.includes('Error') ? 'error' : 'success'}">
            ${this.saveMessage}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tool-saver': ToolSaver;
  }
}