import { defineConfig } from 'astro/config';
import clerk from '@clerk/astro';
import react from '@astrojs/react';
import node from '@astrojs/node'; // Para Node standalone
import tailwindcss from '@tailwindcss/vite';
import { esES } from '@clerk/localizations';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  integrations: [
    clerk({
      localization: esES,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    }),
    react(),
  ],
  adapter: node({ mode: 'standalone' }),
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    allowedHosts: ['74c839f3adfd.ngrok-free.app'], // ✅ permite el host de ngrok
  },
  hmr: {
    clientPort: 443,
  },
});