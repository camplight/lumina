import './style.css';
import './chat/presentation/chat';
import './project_tree/presentation/project_tree';
import { Wails_project_tree_lister } from './project_tree/infrastructure/wails_project_tree_lister';
import { Wails_chat_service } from './chat/infrastructure/wails_chat_service';

// Add global styles for the layout
const style = document.createElement('style');
style.textContent = `
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  // Create main container
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.height = '100vh';
  container.style.width = '100vw';
  container.style.overflow = 'hidden';

  // Create left panel for chat
  const leftPanel = document.createElement('div');
  leftPanel.style.flex = '1';
  leftPanel.style.display = 'flex';
  leftPanel.style.flexDirection = 'column';
  leftPanel.style.borderRight = '1px solid #e0e0e0';
  leftPanel.style.minWidth = '0'; // Allow shrinking

  // Create right panel for project tree
  const rightPanel = document.createElement('div');
  rightPanel.style.width = '300px';
  rightPanel.style.display = 'flex';
  rightPanel.style.flexDirection = 'column';
  rightPanel.style.overflow = 'auto';
  rightPanel.style.backgroundColor = '#fafafa';

  // Create and configure chat interface
  const chatService = new Wails_chat_service();
  const chatInterface = document.createElement('chat-interface') as any;
  chatInterface.service = chatService;

  // Create and configure project tree
  const treeLister = new Wails_project_tree_lister();
  const projectTree = document.createElement('project-tree') as any;
  projectTree.lister = treeLister;

  // Assemble the layout
  leftPanel.appendChild(chatInterface);
  rightPanel.appendChild(projectTree);
  container.appendChild(leftPanel);
  container.appendChild(rightPanel);

  // Clear body and add container
  document.body.innerHTML = '';
  document.body.appendChild(container);
});