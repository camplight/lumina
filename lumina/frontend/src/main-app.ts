import {customElement} from 'lit/decorators.js';
import {css, html, LitElement} from 'lit';
import './chat/presentation/chat-interface';
import './project_tree/presentation/project_tree';
import {WailsChatService} from './chat/infrastructure/wails_chat_service';
import {WailsProjectTreeLister} from './project_tree/infrastructure/wails_project_tree_lister';

@customElement('main-app')
export class MainApp extends LitElement {
  static styles = css`
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
      
    .container {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    
    .leftPanel {
      display: flex;
      flex: 1;
      flex-direction: column;
      border-right: 1px solid #e0e0e0;
      min-width: 0;
    }
    
    .rightPanel {
      display: flex;
      flex-direction: column;
      overflow: auto;
      width: 300px;
      background-color: #fafafa;
    }
  `;

  render() {
    const chatService = new WailsChatService();
    const treeLister = new WailsProjectTreeLister();

    return html`
      <div class="container">
        <div class="leftPanel">
          <chat-interface .service=${chatService}></chat-interface>
        </div>
        <div class="rightPanel">
          <project-tree .lister=${treeLister}></project-tree>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'main-app': MainApp;
  }
}