import {GetCurrentProjectTree} from '../../../wailsjs/go/main/App';
import {ProjectTreeLister} from '../domain/project_tree_lister';
import {Node} from '../domain/node';

export class Wails_project_tree_lister implements ProjectTreeLister {
  async getCurrentProjectTree(): Promise<Node> {
    const result = await GetCurrentProjectTree();

    return {
      name: result.name,
      type: result.type as 'directory' | 'file',
      children: result.children || [],
    };
  }
}