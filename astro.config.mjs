import { defineConfig } from 'astro/config';
import clerk from '@clerk/astro';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless'; // Para Vercel
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
  adapter: vercel(),
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
});