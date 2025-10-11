import {describe, it, expect, beforeEach} from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import './tool-search';
import { ToolSearch } from './tool-search';
import { Tool, ToolService } from '../domain/tool_service';

// Mock ToolService implementation for testing
class MockToolService implements ToolService {
  private tools: Tool[] = [
    {
      id: '1',
      name: 'File Reader',
      code: 'const fs = require("fs");',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Data Processor',
      code: 'function processData(data) { return data.map(x => x * 2); }',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: '3',
      name: 'HTTP Client',
      code: 'const axios = require("axios");',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    }
  ];

  async saveTool(name: string, code: string): Promise<Tool> {
    const newTool: Tool = {
      id: String(this.tools.length + 1),
      name,
      code,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tools.push(newTool);
    return newTool;
  }

  async listTools(): Promise<Tool[]> {
    return [...this.tools];
  }

  async getTool(id: string): Promise<Tool> {
    const tool = this.tools.find(t => t.id === id);
    if (!tool) {
      throw new Error(`Tool with id ${id} not found`);
    }
    return tool;
  }
}

describe('ToolSearch', () => {
  let mockToolService: MockToolService;
  let element: ToolSearch;

  beforeEach(async () => {
    mockToolService = new MockToolService();
    element = await fixture<ToolSearch>(html`<tool-search .toolService=${mockToolService}></tool-search>`);
    await element.updateComplete;
  });

  it('renders with search input', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;
    expect(searchInput).to.exist;
    expect(searchInput.placeholder).to.equal('Search for tools...');
  });

  it('loads tools when it gets displayed', async () => {
    // Tools should be loaded after connection
    await element.updateComplete;

    // Trigger a search to show dropdown
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350)); // Wait for debounce
    await element.updateComplete;

    const dropdown = element.shadowRoot!.querySelector('.dropdown');
    expect(dropdown).to.exist;
  });

  it('filters tools based on search query', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Search for "File"
    searchInput.value = 'File';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350)); // Wait for debounce
    await element.updateComplete;

    const dropdownItems = element.shadowRoot!.querySelectorAll('.dropdownItem');
    expect(dropdownItems.length).to.equal(1);
    const toolName = dropdownItems[0]!.querySelector('.toolName') as HTMLElement;
    expect(toolName.textContent).to.include('File Reader');
  });

  it('shows all tools when search query is empty', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Empty search
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350)); // Wait for debounce
    await element.updateComplete;

    const dropdownItems = element.shadowRoot!.querySelectorAll('.dropdownItem');
    expect(dropdownItems.length).to.equal(3); // All tools should be shown
  });

  it('shows "No tools found" message when search has no results', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Search for non-existent tool
    searchInput.value = 'NonExistent';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350)); // Wait for debounce
    await element.updateComplete;

    const noResults = element.shadowRoot!.querySelector('.noResults');
    expect(noResults).to.exist;
    expect(noResults!.textContent).to.include('No tools found');
  });

  
  it('opens dropdown when typing in search input', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));

    await element.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for input processing

    const dropdown = element.shadowRoot!.querySelector('.dropdown');
    expect(dropdown!.classList.contains('hidden')).to.be.false;
  });

  it('closes dropdown on blur', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // First open dropdown
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));
    await element.updateComplete;

    // Then blur
    searchInput.dispatchEvent(new Event('blur'));
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for blur timeout
    await element.updateComplete;

    const dropdown = element.shadowRoot!.querySelector('.dropdown');
    expect(dropdown!.classList.contains('hidden')).to.be.true;
  });

  it('selects tool when dropdown item is clicked', async () => {
    let selectedTool: Tool | null = null;
    element.addEventListener('tool-selected', (event: any) => {
      selectedTool = event.detail.tool;
    });

    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Trigger search to show dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Click on first tool
    const firstItem = element.shadowRoot!.querySelector('.dropdownItem') as HTMLElement;
    firstItem.click();

    expect(selectedTool).to.exist;
    expect(selectedTool!.name).to.equal('File Reader');
  });

  it('calls onToolSelected callback when provided', async () => {
    let callbackTool: Tool | null = null;
    element.onToolSelected = (tool: Tool) => {
      callbackTool = tool;
    };

    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Trigger search to show dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Click on first tool
    const firstItem = element.shadowRoot!.querySelector('.dropdownItem') as HTMLElement;
    firstItem.click();

    expect(callbackTool).to.exist;
    expect(callbackTool!.name).to.equal('File Reader');
  });

  it('updates search input with selected tool name', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Trigger search to show dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Click on second tool
    const items = element.shadowRoot!.querySelectorAll('.dropdownItem') as NodeListOf<HTMLElement>;
    items[1].click();

    await element.updateComplete;
    expect(searchInput.value).to.equal('Data Processor');
  });

  it('handles keyboard navigation - arrow down', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Open dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Press arrow down
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await element.updateComplete;

    const selectedItem = element.shadowRoot!.querySelector('.dropdownItem.selected') as HTMLElement;
    expect(selectedItem).to.exist;
    expect(selectedItem.textContent).to.include('File Reader');
  });

  it('handles keyboard navigation - arrow up', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Open dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Press arrow down twice, then arrow up
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await element.updateComplete;

    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await element.updateComplete;

    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await element.updateComplete;

    const selectedItem = element.shadowRoot!.querySelector('.dropdownItem.selected') as HTMLElement;
    expect(selectedItem).to.exist;
    expect(selectedItem.textContent).to.include('File Reader'); // Should be back to first item
  });

  it('handles keyboard navigation - enter to select', async () => {
    let selectedTool: Tool | null = null;
    element.addEventListener('tool-selected', (event: any) => {
      selectedTool = event.detail.tool;
    });

    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Open dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Press arrow down then enter
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await element.updateComplete;

    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await element.updateComplete;

    expect(selectedTool).to.exist;
    expect(selectedTool!.name).to.equal('File Reader');
  });

  it('handles keyboard navigation - escape to close', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Open dropdown
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    // Press escape
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await element.updateComplete;

    const dropdown = element.shadowRoot!.querySelector('.dropdown');
    expect(dropdown!.classList.contains('hidden')).to.be.true;
  });

  it('debounces search input', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    // Type multiple characters quickly
    searchInput.value = 'F';
    searchInput.dispatchEvent(new Event('input'));

    searchInput.value = 'Fi';
    searchInput.dispatchEvent(new Event('input'));

    searchInput.value = 'Fil';
    searchInput.dispatchEvent(new Event('input'));

    // Should not show results immediately
    const dropdownItems = element.shadowRoot!.querySelectorAll('.dropdownItem');
    expect(dropdownItems.length).to.equal(0);

    // Should show results after debounce delay
    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    const itemsAfterDebounce = element.shadowRoot!.querySelectorAll('.dropdownItem');
    expect(itemsAfterDebounce.length).to.be.greaterThan(0);
  });

  it('shows loading state while fetching tools', async () => {
    // Create a mock service that delays
    let resolvePromise: () => void;
    const delayedPromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });

    const delayedToolService = {
      listTools: () => delayedPromise.then(() => mockToolService.listTools()),
      saveTool: mockToolService.saveTool.bind(mockToolService),
      getTool: mockToolService.getTool.bind(mockToolService)
    } as ToolService;

    const delayedElement = await fixture(html`<tool-search .toolService=${delayedToolService}></tool-search>`) as ToolSearch;
    await delayedElement.updateComplete;

    const searchInput = delayedElement.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));

    await delayedElement.updateComplete;

    const loading = delayedElement.shadowRoot!.querySelector('.loading');
    expect(loading).to.exist;
    expect(loading!.textContent).to.include('Loading tools');

    // Resolve the promise
    resolvePromise!();
    await new Promise(resolve => setTimeout(resolve, 50));
    await delayedElement.updateComplete;

    const loadingAfter = delayedElement.shadowRoot!.querySelector('.loading');
    expect(loadingAfter).to.not.exist;
  });

  it('handles tool service errors gracefully', async () => {
    const errorService = {
      listTools: () => Promise.reject(new Error('Service unavailable')),
      saveTool: mockToolService.saveTool.bind(mockToolService),
      getTool: mockToolService.getTool.bind(mockToolService)
    } as ToolService;

    const errorElement = await fixture(html`<tool-search .toolService=${errorService}></tool-search>`) as ToolSearch;
    await errorElement.updateComplete;

    // Should not crash, just show no tools
    const searchInput = errorElement.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await errorElement.updateComplete;

    const noResults = errorElement.shadowRoot!.querySelector('.noResults');
    expect(noResults).to.exist;
  });

  it('displays tool creation dates in correct format', async () => {
    const searchInput = element.shadowRoot!.querySelector('.searchInput') as HTMLInputElement;

    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    await new Promise(resolve => setTimeout(resolve, 350));
    await element.updateComplete;

    const dates = element.shadowRoot!.querySelectorAll('.toolDate');
    expect(dates.length).to.equal(3);

    // Check that dates are formatted (should include year)
    dates.forEach(date => {
      expect(date!.textContent).to.match(/\d{4}/); // Should contain 4-digit year
    });
  });
});