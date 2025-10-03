import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'src/**/*.spec.ts',

  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'auto',
      tsconfig: './tsconfig.json',
      loaders: { '.ts': 'ts' },
    }),
  ],

  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],

  testFramework: {
    config: {
      timeout: 3000,
    },
  },

  // Handle CommonJS modules
  nodeResolve: true,

  // Dedupe to avoid multiple versions
  dedupe: ['lit', 'lit-html', 'lit-element', '@open-wc/testing'],

  coverageConfig: {
    report: true,
    reportDir: 'coverage',
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};