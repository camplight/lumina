import {describe, it, expect, beforeEach} from 'vitest';
import {fixture, html} from '@open-wc/testing-helpers';
import {ToolSaver} from './tool-saver';
import {ToolService} from '../domain/tool_service';

// Mock Tool Service implementation for testing
class MockToolService implements ToolService {
  private mockResponse: any = null;
  private mockError: Error | null = null;

  setMockResponse(response: any) {
    this.mockResponse = response;
    this.mockError = null;
  }

  setMockError(error: Error) {
    this.mockError = error;
    this.mockResponse = null;
  }

  async saveTool(name: string, code: string): Promise<any> {
    if (this.mockError) {
      throw this.mockError;
    }
    return this.mockResponse;
  }
}

// Helper to check if text is visible anywhere in the component
function isTextVisible(element: Element, text: string): boolean {
  return element.textContent?.includes(text) ?? false;
}

describe('Tool Saver Acceptance Tests', () => {
  let element: ToolSaver;
  let mockService: MockToolService;

  beforeEach(async () => {
    mockService = new MockToolService();
    element = await fixture(html`<tool-saver .toolService=${mockService}></tool-saver>`);
  });

  describe('Initial State', () => {
    it('should render the component', () => {
      expect(element).to.exist;
      expect(element.shadowRoot).to.exist;
    });

    it('should render with empty tool name input', () => {
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      expect(input).to.exist;
      expect(input.value).to.equal('');
    });

    it('should render save button disabled when no name and code provided', () => {
      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      expect(saveButton).to.exist;
      expect(saveButton.disabled).to.be.true;
    });

    it('should enable save button when both name and code are provided', async () => {
      element.code = 'console.log("test");';
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      expect(saveButton.disabled).to.be.false;
    });
  });

  describe('Save Functionality', () => {
    it('should show error when trying to save with empty tool name', async () => {
      element.code = 'console.log("test");';
      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;

      expect(isTextVisible(element, 'Please enter a tool name')).toBe(true);
      expect(element.shadowRoot!.querySelector('.saveMessage.error')).to.exist;
    });

    it('should show error when trying to save with empty code', async () => {
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;

      expect(isTextVisible(element, 'Cannot save an empty tool')).toBe(true);
      expect(element.shadowRoot!.querySelector('.saveMessage.error')).to.exist;
    });

    it('should show error when tool service is not provided', async () => {
      const elementWithoutService = await fixture(html`<tool-saver></tool-saver>`) as ToolSaver;
      elementWithoutService.code = 'console.log("test");';

      const input = elementWithoutService.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await elementWithoutService.updateComplete;

      const saveButton = elementWithoutService.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await elementWithoutService.updateComplete;

      expect(isTextVisible(elementWithoutService, 'Error: Tool service not available')).toBe(true);
    });

    it('should successfully save tool with valid name and code', async () => {
      const mockTool = {
        id: 'test-id',
        name: 'Test Tool',
        code: 'console.log("test");',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.setMockResponse(mockTool);

      element.code = 'console.log("test");';
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 0));
      await element.updateComplete;

      expect(isTextVisible(element, 'Tool "Test Tool" saved successfully!')).toBe(true);
      expect(element.shadowRoot!.querySelector('.saveMessage.success')).to.exist;

      // Check that input is cleared after successful save
      expect(input.value).to.equal('');
    });

    it('should show error message when save fails', async () => {
      mockService.setMockError(new Error('Database error'));

      element.code = 'console.log("test");';
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 0));
      await element.updateComplete;

      expect(isTextVisible(element, 'Error: Database error')).toBe(true);
      expect(element.shadowRoot!.querySelector('.saveMessage.error')).to.exist;
    });

    it('should dispatch tool-saved event on successful save', async () => {
      const mockTool = {
        id: 'test-id',
        name: 'Test Tool',
        code: 'console.log("test");',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.setMockResponse(mockTool);

      let eventFired = false;
      let eventData: any = null;
      element.addEventListener('tool-saved', (event: CustomEvent) => {
        eventFired = true;
        eventData = event.detail;
      });

      element.code = 'console.log("test");';
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 0));
      await element.updateComplete;

      expect(eventFired).to.be.true;
      expect(eventData.tool).to.deep.equal(mockTool);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while saving', async () => {
      let resolvePromise: (value: any) => void;
      mockService.setMockResponse(Promise.resolve().then(() => {
        return new Promise(resolve => {
          resolvePromise = resolve;
        });
      }));

      element.code = 'console.log("test");';
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;

      // Should show loading state
      expect(saveButton.textContent).to.equal('Saving...');
      expect(saveButton.disabled).to.be.true;

      const inputDisabled = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      expect(inputDisabled.disabled).to.be.true;

      // Resolve the promise
      resolvePromise!({
        id: 'test-id',
        name: 'Test Tool',
        code: 'console.log("test");',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await element.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 0));
      await element.updateComplete;

      // Should return to normal state
      expect(saveButton.textContent).to.equal('Save');
      expect(saveButton.disabled).to.be.false;
      expect(inputDisabled.disabled).to.be.false;
    });
  });

  describe('Keyboard Interactions', () => {
    it('should save tool when Enter key is pressed in input field', async () => {
      const mockTool = {
        id: 'test-id',
        name: 'Test Tool',
        code: 'console.log("test");',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.setMockResponse(mockTool);

      element.code = 'console.log("test");';
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test Tool';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keypress', {key: 'Enter'});
      input.dispatchEvent(enterEvent);

      await element.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 0));
      await element.updateComplete;

      expect(isTextVisible(element, 'Tool "Test Tool" saved successfully!')).toBe(true);
    });
  });

  describe('Message Clearing', () => {
    it('should clear save message when input changes after error', async () => {
      // First trigger an error
      const saveButton = element.shadowRoot!.querySelector('.saveButton') as HTMLButtonElement;
      saveButton.click();

      await element.updateComplete;

      expect(element.shadowRoot!.querySelector('.saveMessage')).to.exist;

      // Change input
      const input = element.shadowRoot!.querySelector('.toolNameInput') as HTMLInputElement;
      input.value = 'Test';
      input.dispatchEvent(new Event('input'));

      await element.updateComplete;

      // Message should be cleared
      expect(element.shadowRoot!.querySelector('.saveMessage')).to.not.exist;
    });
  });
});