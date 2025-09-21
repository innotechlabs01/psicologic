import { defineConfig } from 'astro/config';
import clerk from '@clerk/astro';
import preact from '@astrojs/preact';
import vercel from '@astrojs/vercel/serverless'; // Para Vercel serverless
import node from '@astrojs/node'; // Para Node standalone
import tailwindcss from '@tailwindcss/vite';
import { esES } from '@clerk/localizations';

// Seleccionar adaptador según variable de entorno
const adapter = process.env.DEPLOY_ENV === 'vercel' 
  ? vercel() 
  : node({ mode: 'standalone' });

export default defineConfig({
  integrations: [
    clerk({
      localization: esES,
    }),
    preact(),
  ],
  adapter, // Usar el adaptador seleccionado
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
});