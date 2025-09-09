// @ts-check
import { defineConfig } from 'astro/config';
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import { esES } from '@clerk/localizations'
import dotenv from 'dotenv';
import './src/utils/env'; // Esto carga y valida el .env automáticamente


dotenv.config();
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [clerk({
      localization: esES,
    })],
  adapter: node({ mode: "standalone" }),
  output: "server",
  vite: {
    plugins: [tailwindcss()]
  }
});