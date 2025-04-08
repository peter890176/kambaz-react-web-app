import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@react-icons/all-files', 'react-icons']
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MISSING_EXPORT') return;
        warn(warning);
      }
    }
  }
})
