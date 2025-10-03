import { Node } from './node';

export interface ProjectTreeLister {
  getCurrentProjectTree(): Promise<Node>;
}

export async function getProjectTreeUseCase(
  lister: ProjectTreeLister
): Promise<Node> {
  return lister.getCurrentProjectTree();
}
