import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devApi } from './dev/api-plugin'

export default defineConfig(({ mode }) => {
  // Make APP_PASSWORD etc. from .env.local available to the dev API
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), tailwindcss(), devApi()],
  }
})
