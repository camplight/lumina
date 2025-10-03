import { describe, it, expect } from 'vitest';
import { Node } from './node';
import {getProjectTreeUseCase, ProjectTreeLister} from './project_tree_lister';

class MockProjectTreeLister implements ProjectTreeLister {
  constructor(private mockData: Node) {}

  async getCurrentProjectTree(): Promise<Node> {
    return this.mockData;
  }
}

describe('ProjectTreeUseCase', () => {
  it('should return the tree structure from the lister', async () => {
    // Given a lister that returns a tree structure
    const mockTree: Node = {
      name: 'project',
      type: 'directory',
      children: [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'app.ts', type: 'file', children: [] },
          ],
        },
        { name: 'README.md', type: 'file', children: [] },
      ],
    };
    const mockLister = new MockProjectTreeLister(mockTree);

    // When getting the project tree
    const result = await getProjectTreeUseCase(mockLister);

    // Then it should return the tree structure
    expect(result).toEqual(mockTree);
  });
});