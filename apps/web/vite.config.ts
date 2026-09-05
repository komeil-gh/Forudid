import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../..', '')
  const target = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:58000'
  return {
    plugins: [react(), tailwindcss()], envDir: '../..',
    server: { port: Number(env.WEB_PORT || 5173), strictPort: true,
      proxy: { '/api': target, '/tiles': target, '/health': target } },
  }
})
