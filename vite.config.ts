// vite.config.ts

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // 👈 ¡CAMBIO AQUÍ!

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga todas las variables de entorno de .env.local
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()], // 👈 Usamos el plugin importado
    // Definimos variables globales para el navegador
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});