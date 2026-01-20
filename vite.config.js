import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: 'public/dist',
    manifest: true,
    rollupOptions: {
      input: 'src/style.css',
    }
  }
})
