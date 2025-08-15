import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
    base: "./",
    plugins: [react()],
    server: {
        allowedHosts: true,
        port: 1006
    },
    appType: "mpa",
    build: {
        rollupOptions: {
            input: {
                main: "./index.html",
                leaderboard: "./leaderboard.html"
            }
        }
    }
})
