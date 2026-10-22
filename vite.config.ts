import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Safari 12 (iOS 12) supports native ES modules, but not all modern syntax
  // used by the default Vite 8 target.
  build: {
    target: 'safari12',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5080',
    },
  },
});
