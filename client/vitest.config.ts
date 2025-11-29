/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use node environment for utility function tests
    environment: 'node',
    
    // Global test timeout
    testTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/*.d.ts',
        'lib/**/*.test.ts',
        'lib/**/*.spec.ts',
        'node_modules/**',
      ],
    },
    
    // Include/exclude patterns - only test lib directory
    include: ['lib/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.next', 'app/**', 'components/**'],
    
    // Disable global setup
    globalSetup: undefined,
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Don't transform CSS files
    css: false,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  
  // Override any postcss config
  esbuild: {
    // Use esbuild for transforms
  },
});

