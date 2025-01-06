import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  worker: {
    format: 'es'
  },
  plugins: [react()],
  resolve: {
    alias: {
      src: '/src',
      components: '/src/components',
      contexts: '/src/contexts',
      pages: '/src/pages',
      services: '/src/services',
      types: '/src/types',
      utilities: '/src/utilities',
    },
  },
});
