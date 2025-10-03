import './style.css';
import './project_tree/presentation/project-tree';
import { WailsProjectTreeLister } from './project_tree/infrastructure/WailsProjectTreeLister';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
  // Create the lister
  const lister = new WailsProjectTreeLister();

  // Create component with lister already injected
  const projectTree = document.createElement('project-tree') as any;
  projectTree.lister = lister;

  // Add to body
  document.body.appendChild(projectTree);
});
