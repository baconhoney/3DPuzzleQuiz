import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/search/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["gombosnet.ddns.net", "cicanet.ddns.net"],
    port: 2008,
  },
})