import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Docker Desktop bind mounts (esp. Windows host <-> Linux container)
    // don't always deliver native file-change events, so HMR needs polling.
    watch: {
      usePolling: true,
    },
  },
})
