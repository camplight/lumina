import {describe, it} from 'vitest';
import {expect, fixture, html} from '@open-wc/testing';
import './execution-result';
import type {ExecutionResult} from './execution-result';

describe('ExecutionResult', () => {
  it('prompts user to execute code when no result is available', async () => {
    const element: ExecutionResult = await fixture(html`<execution-result></execution-result>`);
    await element.updateComplete;

    const text = element.shadowRoot!.textContent!;
    expect(text).to.include('Click "Execute" to run your TypeScript code');
  });

  it('shows executing message while code is running', async () => {
    const element: ExecutionResult = await fixture(html`<execution-result></execution-result>`);
    element.loading = true;
    await element.updateComplete;

    const text = element.shadowRoot!.textContent!;
    expect(text).to.include('Executing...');
  });

  it('displays successful execution output', async () => {
    const element: ExecutionResult = await fixture(html`<execution-result></execution-result>`);
    element.result = {
      output: 'Hello, World!\n',
      error: '',
      success: true,
      exitCode: 0
    };
    await element.updateComplete;

    const text = element.shadowRoot!.textContent!;
    expect(text).to.include('Success');
    expect(text).to.include('Hello, World!');
    expect(text).to.include('Exit code: 0');
  });

  it('displays error message when execution fails', async () => {
    const element: ExecutionResult = await fixture(html`<execution-result></execution-result>`);
    element.result = {
      output: '',
      error: 'TypeError: Cannot read property of undefined',
      success: false,
      exitCode: 1
    };
    await element.updateComplete;

    const text = element.shadowRoot!.textContent!;
    expect(text).to.include('Failed');
    expect(text).to.include('TypeError: Cannot read property of undefined');
    expect(text).to.include('Exit code: 1');
  });

  it('displays both output and error when both are present', async () => {
    const element: ExecutionResult = await fixture(html`<execution-result></execution-result>`);
    element.result = {
      output: 'Partial output\n',
      error: 'Warning: Deprecated method\n',
      success: true,
      exitCode: 0
    };
    await element.updateComplete;

    const text = element.shadowRoot!.textContent!;
    expect(text).to.include('Success');
    expect(text).to.include('Partial output');
    expect(text).to.include('Warning: Deprecated method');
  });

  it('shows empty output when execution succeeds with no output', async () => {
    const element: ExecutionResult = await fixture(html`<execution-result></execution-result>`);
    element.result = {
      output: '',
      error: '',
      success: true,
      exitCode: 0
    };
    await element.updateComplete;

    const text = element.shadowRoot!.textContent!;
    expect(text).to.include('Success');
    expect(text).to.include('Exit code: 0');
  });
});