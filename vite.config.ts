// vite.config.ts - VERSIÓN LIMPIA

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // En producción, Vite carga las variables automáticamente. 
  // Si usaste la solución 'define' y el app funciona, déjala.
  // Pero lo ideal es que el componente lea 'import.meta.env' directamente sin 'define'.
  
  return {
    plugins: [react()],
    // Quita el bloque 'define' si lo habías añadido.
    /* define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    } */
  };
});