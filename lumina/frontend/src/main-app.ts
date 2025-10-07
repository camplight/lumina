import {customElement, state} from 'lit/decorators.js';
import {html, LitElement} from 'lit';
import './code_editor/presentation/code-editor';
import './code_editor/presentation/execution-result';
import {ExecutionResult, WailsTypeScriptExecutor} from './code_editor/infrastructure/wails_typescript_executor';

@customElement('main-app')
export class MainApp extends LitElement {
  // Disable Shadow DOM for consistent styling with code-editor
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();

    // Apply styles since Shadow DOM is disabled
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }

      main-app .container {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }

      main-app .leftPanel {
        display: flex;
        flex: 1;
        flex-direction: column;
        border-right: 1px solid #e0e0e0;
        min-width: 0;
      }

      main-app .rightPanel {
        display: flex;
        flex-direction: column;
        overflow: auto;
        width: 400px;
        min-width: 300px;
        background-color: #fafafa;
      }

      main-app .executeButton {
        margin: 16px;
        padding: 12px 24px;
        background-color: #1976d2;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      main-app .executeButton:hover {
        background-color: #1565c0;
      }

      main-app .executeButton:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      main-app .editorHeader {
        padding: 16px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        font-weight: 600;
        color: #333;
      }

      main-app code-editor {
        flex: 1;
        display: flex;
        min-height: 0;
      }
    `;
    if (!document.querySelector('style[data-main-app]')) {
      style.setAttribute('data-main-app', '');
      document.head.appendChild(style);
    }
  }

  @state()
  private isExecuting = false;

  @state()
  private currentCode = '// Start typing your TypeScript code here\nconsole.log("Hello, World!");';

  @state()
  private executionResult: ExecutionResult | null = null;

  private executor = new WailsTypeScriptExecutor();

  render() {
    return html`
      <div class="container">
        <div class="leftPanel">
          <div class="editorHeader">TypeScript Editor</div>
          <code-editor
            .code=${this.currentCode}
            @code-change=${this.handleCodeChange}
          ></code-editor>
        </div>
        <div class="rightPanel">
          <button
            class="executeButton"
            ?disabled=${this.isExecuting}
            @click=${this.executeCode}
          >
            ${this.isExecuting ? 'Executing...' : 'Execute'}
          </button>
          <execution-result
            .result=${this.executionResult}
            .loading=${this.isExecuting}
          ></execution-result>
        </div>
      </div>
    `;
  }

  private handleCodeChange(event: CustomEvent) {
    this.currentCode = event.detail.code;
  }

  private async executeCode() {
    this.isExecuting = true;
    this.executionResult = null;

    try {
      this.executionResult = await this.executor.execute(this.currentCode);
    } catch (error) {
      this.executionResult = {
        output: '',
        error: String(error),
        success: false,
        exitCode: 1
      };
    } finally {
      this.isExecuting = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'main-app': MainApp;
  }
}