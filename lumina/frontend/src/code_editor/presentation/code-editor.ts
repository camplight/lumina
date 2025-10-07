import {customElement, property, state} from 'lit/decorators.js';
import {html, LitElement} from 'lit';
import * as monaco from 'monaco-editor';
import loader from '@monaco-editor/loader';

@customElement('code-editor')
export class CodeEditor extends LitElement {
  // Disable Shadow DOM so Monaco styles work properly
  createRenderRoot() {
    return this;
  }

  @property({type: String})
  code = '// Start typing your TypeScript code here\nconsole.log("Hello, World!");';

  @state()
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  async firstUpdated() {
    // Apply styles since Shadow DOM is disabled
    const style = document.createElement('style');
    style.textContent = `
      code-editor {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      code-editor .editorContainer {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      code-editor .editor {
        flex: 1;
        min-height: 0;
      }
    `;
    if (!document.querySelector('style[data-code-editor]')) {
      style.setAttribute('data-code-editor', '');
      document.head.appendChild(style);
    }

    await this.initializeEditor();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.editor) {
      this.editor.dispose();
    }
  }

  private async initializeEditor() {
    const container = this.querySelector('.editor') as HTMLElement;
    if (!container) return;

    // Configure Monaco loader
    loader.config({
      'vs/nls': {
        availableLanguages: {
          '*': 'en'
        }
      }
    });

    const monaco = await loader.init();

    // Create the editor
    this.editor = monaco.editor.create(container, {
      value: this.code,
      language: 'typescript',
      theme: 'vs-light',
      automaticLayout: true,
      minimap: {enabled: false},
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 2,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      renderWhitespace: 'selection'
    });

    // Listen for changes
    this.editor.onDidChangeModelContent(() => {
      if (this.editor) {
        this.code = this.editor.getValue();
        this.dispatchEvent(new CustomEvent('code-change', {
          detail: {code: this.code},
          bubbles: true
        }));
      }
    });
  }

  render() {
    return html`
      <div class="editorContainer">
        <div class="editor"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'code-editor': CodeEditor;
  }
}