import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  // Port 5173 is often taken by another local project — prefer 5174, but fall
  // back to the next free port. The API CORS config allows any localhost:517x.
  server: { port: 5174, strictPort: false },
  preview: { port: 5174, strictPort: false },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
