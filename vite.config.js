import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Matikan overlay notification/error milik Vite HMR saat dev di localhost
  server: {
    hmr: {
      overlay: false,
    },
  },
  // Opsional: minimalkan log di console dev jika dirasa mengganggu
  // logLevel: 'silent',
})
