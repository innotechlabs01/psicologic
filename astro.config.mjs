import { defineConfig } from 'astro/config'
import clerk from '@clerk/astro'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel/serverless'
import tailwindcss from '@tailwindcss/vite'
import { esES } from '@clerk/localizations'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  output: 'server',

  adapter: vercel({
    edgeMiddleware: false // ⛔ evita edge si no lo necesitas (más estable)
  }),

  integrations: [
    clerk({
      localization: esES,
      publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    }),

    react({
      // ⚡ react 18 optimizado
      experimentalReactChildren: true,
      fastRefresh: true
    })
  ],

  vite: {
    plugins: [tailwindcss()],

    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true
    },

    ssr: {
      external: [
        'pdfjs-dist',
        'canvas'
      ]
    }
  },

  // ⚡ Prefetch inteligente
  prefetch: {
    defaultStrategy: 'viewport'
  }
})
