import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// В разработке запросы к бэкенду проксируются на Go-сервер,
// чтобы фронтенд и API жили на одном origin (сессионная cookie — HttpOnly, SameSite=Lax).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = process.env.BACKEND_URL ?? env.BACKEND_URL ?? 'http://localhost:8080';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': backendUrl,
        '/me': backendUrl,
        '/health': backendUrl,
        '/minors': backendUrl,
        '/reviews': backendUrl,
      },
    },
  };
});
