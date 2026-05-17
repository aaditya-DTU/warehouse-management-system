import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeProxyTarget = (rawValue) => {
  if (!rawValue) {
    return 'http://localhost:5000';
  }

  const cleanedValue = String(rawValue).trim().replace(/[;,\s]+$/, '');

  if (!cleanedValue) {
    return 'http://localhost:5000';
  }

  return cleanedValue.replace(/\/api\/?$/, '');
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: normalizeProxyTarget(env.VITE_API_URL),
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
