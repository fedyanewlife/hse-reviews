import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В разработке запросы к бэкенду проксируются на Go-сервер,
// чтобы фронтенд и API жили на одном origin (сессионная cookie — HttpOnly, SameSite=Lax).
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': backendUrl,
      '/me': backendUrl,
      '/health': backendUrl,
    },
  },
});
