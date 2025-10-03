import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import './project-tree';
import { ProjectTree } from './project-tree';
import { ProjectTreeLister } from '../domain/project_tree_lister';
import { Node } from '../domain/node';

class MockProjectTreeLister implements ProjectTreeLister {
  constructor(private mockData: Node) {}

  async getCurrentProjectTree(): Promise<Node> {
    return this.mockData;
  }
}

describe('ProjectTree Integration Tests', () => {
  let mockTree: Node;

  beforeEach(() => {
    mockTree = {
      name: 'project-root',
      type: 'directory',
      children: [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'app.ts', type: 'file', children: [] },
            { name: 'index.ts', type: 'file', children: [] },
          ],
        },
        {
          name: 'tests',
          type: 'directory',
          children: [
            { name: 'app.test.ts', type: 'file', children: [] },
          ],
        },
        { name: 'README.md', type: 'file', children: [] },
        { name: 'package.json', type: 'file', children: [] },
      ],
    };
  });

  it('should display the proper header', async () => {
    const lister = new MockProjectTreeLister(mockTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    const header = el.shadowRoot!.querySelector('h2');
    expect(header).toBeTruthy();
    expect(header!.textContent).toBe('Project Structure');
  });

  it('should list files in the root directory', async () => {
    const lister = new MockProjectTreeLister(mockTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    const treeNodes = el.shadowRoot!.querySelectorAll('.tree-node');
    const fileNames = Array.from(treeNodes).map(node =>
      node.querySelector('.name')?.textContent
    );

    expect(fileNames).toContain('README.md');
    expect(fileNames).toContain('package.json');
  });

  it('should list directories in the root directory', async () => {
    const lister = new MockProjectTreeLister(mockTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    const treeNodes = el.shadowRoot!.querySelectorAll('.tree-node');
    const directoryNames = Array.from(treeNodes).map(node =>
      node.querySelector('.name')?.textContent
    );

    expect(directoryNames).toContain('src');
    expect(directoryNames).toContain('tests');
  });

  it('should display proper message on empty directory', async () => {
    const emptyTree: Node = {
      name: 'empty-project',
      type: 'directory',
      children: [],
    };

    const lister = new MockProjectTreeLister(emptyTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    // Root directory should be shown
    const treeNodes = el.shadowRoot!.querySelectorAll('.tree-node');
    expect(treeNodes.length).toBe(1);

    const rootNode = treeNodes[0];
    expect(rootNode.querySelector('.name')?.textContent).toBe('empty-project');

    // No children should be visible
    const childrenContainer = el.shadowRoot!.querySelector('.children');
    expect(childrenContainer).toBeFalsy();
  });

  it('should expand directory and show children when clicked', async () => {
    const lister = new MockProjectTreeLister(mockTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    // Find the 'src' directory node
    const treeNodes = Array.from(el.shadowRoot!.querySelectorAll('.tree-node'));
    const srcNode = treeNodes.find(node =>
      node.querySelector('.name')?.textContent === 'src'
    ) as HTMLElement;

    expect(srcNode).toBeTruthy();

    // Initially, src's children should NOT be visible
    let allNames = Array.from(el.shadowRoot!.querySelectorAll('.name'))
      .map(n => n.textContent);
    expect(allNames).not.toContain('app.ts');
    expect(allNames).not.toContain('index.ts');

    // Click on the src directory to expand it
    srcNode.click();
    await el.updateComplete;

    // Now src's children should be visible
    const updatedNames = Array.from(el.shadowRoot!.querySelectorAll('.name'))
      .map(n => n.textContent);
    expect(updatedNames).toContain('app.ts');
    expect(updatedNames).toContain('index.ts');
  });

  it('should collapse directory when clicked again', async () => {
    const lister = new MockProjectTreeLister(mockTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    // Find and expand the 'src' directory
    const treeNodes = Array.from(el.shadowRoot!.querySelectorAll('.tree-node'));
    const srcNode = treeNodes.find(node =>
      node.querySelector('.name')?.textContent === 'src'
    ) as HTMLElement;

    srcNode.click();
    await el.updateComplete;

    // Verify children are visible
    let allNames = Array.from(el.shadowRoot!.querySelectorAll('.name'))
      .map(n => n.textContent);
    expect(allNames).toContain('app.ts');

    // Click again to collapse
    srcNode.click();
    await el.updateComplete;

    // Children should no longer be visible
    allNames = Array.from(el.shadowRoot!.querySelectorAll('.name'))
      .map(n => n.textContent);
    expect(allNames).not.toContain('app.ts');
    expect(allNames).not.toContain('index.ts');
  });

  it('should distinguish between files and directories with proper icons', async () => {
    const lister = new MockProjectTreeLister(mockTree);
    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${lister}></project-tree>
    `);

    const treeNodes = Array.from(el.shadowRoot!.querySelectorAll('.tree-node'));

    // Find a file node
    const fileNode = treeNodes.find(node =>
      node.querySelector('.name')?.textContent === 'README.md'
    );
    const fileIcon = fileNode?.querySelector('.icon')?.textContent?.trim();
    expect(fileIcon).toBe('📄');

    // Find a directory node (collapsed)
    const dirNode = treeNodes.find(node =>
      node.querySelector('.name')?.textContent === 'src'
    );
    const dirIcon = dirNode?.querySelector('.icon')?.textContent?.trim();
    expect(dirIcon).toBe('▶');
  });

  it('should display error message when loading fails', async () => {
    const errorLister: ProjectTreeLister = {
      getCurrentProjectTree: vi.fn(() =>
        Promise.reject(new Error('Failed to load tree'))
      )
    };

    const el = await fixture<ProjectTree>(html`
      <project-tree .lister=${errorLister}></project-tree>
    `);

    const errorDiv = el.shadowRoot!.querySelector('.error');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv!.textContent).toContain('Failed to load tree');

    // Should show retry button
    const retryButton = el.shadowRoot!.querySelector('button');
    expect(retryButton).toBeTruthy();
    expect(retryButton!.textContent).toContain('Retry');
  });
});