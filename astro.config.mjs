import { defineConfig } from 'astro/config';
import clerk from '@clerk/astro';
import preact from '@astrojs/preact';
import node from '@astrojs/node'; // Para Node standalone
import tailwindcss from '@tailwindcss/vite';
import { esES } from '@clerk/localizations';

export default defineConfig({
  integrations: [
    clerk({
      localization: esES,
      publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    }),
    preact(),
  ],
  adapter: node({ mode: 'standalone' }),
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
});