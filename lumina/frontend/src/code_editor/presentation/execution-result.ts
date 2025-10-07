import {customElement, property} from 'lit/decorators.js';
import {css, html, LitElement} from 'lit';

export interface Result {
  output: string;
  error: string;
  success: boolean;
  exitCode: number;
}

@customElement('execution-result')
export class ExecutionResult extends LitElement {
  static styles = css`
    .resultContainer {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
    }

    .resultHeader {
      padding: 12px 16px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 600;
      color: #333;
    }

    .resultContent {
      flex: 1;
      overflow: auto;
      padding: 16px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.4;
    }

    .empty {
      color: #999;
      font-style: italic;
    }

    .output {
      color: #333;
      white-space: pre-wrap;
      margin: 0;
    }

    .error {
      color: #d32f2f;
      white-space: pre-wrap;
      margin: 0;
    }

    .success {
      color: #388e3c;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .failure {
      color: #d32f2f;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .exitCode {
      color: #666;
      font-size: 12px;
      margin-top: 8px;
    }
  `;

  @property({type: Object})
  result: Result | null = null;

  @property({type: Boolean})
  loading = false;

  render() {
    return html`
      <div class="resultContainer">
        <div class="resultHeader">
          Execution Result
        </div>
        <div class="resultContent">
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  private renderContent() {
    if (this.loading) {
      return html`<div class="empty">Executing...</div>`;
    }

    if (!this.result) {
      return html`<div class="empty">Click "Execute" to run your TypeScript code</div>`;
    }

    return html`
      ${this.result.success
        ? html`<div class="success">✓ Success</div>`
        : html`<div class="failure">✗ Failed</div>`
      }

      ${this.result.output
        ? html`<pre class="output">${this.result.output}</pre>`
        : ''
      }

      ${this.result.error
        ? html`<pre class="error">${this.result.error}</pre>`
        : ''
      }

      <div class="exitCode">Exit code: ${this.result.exitCode}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'execution-result': ExecutionResult;
  }
}