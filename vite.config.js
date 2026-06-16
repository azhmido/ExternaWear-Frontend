import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Mengubah manualChunks dari bentuk objek menjadi fungsi agar kompatibel dengan Rollup di Vercel
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Mengelompokkan React & Router ke dalam chunk 'vendor'
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-router-dom')
            ) {
              return 'vendor';
            }
            // Mengelompokkan library UI & Charts ke dalam chunk 'ui'
            if (
              id.includes('lucide-react') || 
              id.includes('sonner') || 
              id.includes('recharts')
            ) {
              return 'ui';
            }
          }
        }
      }
    }
  },
  base: '/'
})