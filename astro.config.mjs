import { defineConfig } from 'astro/config'
import clerk from '@clerk/astro'
import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'
import { esES } from '@clerk/localizations'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  output: 'server',

  adapter: vercel({
    edgeMiddleware: false
  }),

  integrations: [
    clerk({
      localization: esES,
      publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY
    }),

    react({
      experimentalReactChildren: true,
      fastRefresh: true
    })
  ],

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false
      }
    }
  },

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

  prefetch: {
    defaultStrategy: 'viewport'
  }
})
