import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 5173,     // Default Vite port
  },
  define: {
    // Ensure process.env can be used if needed, though import.meta.env is preferred
    'process.env': process.env
  }
})
