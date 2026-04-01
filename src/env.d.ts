/// <reference types="@clerk/astro/env" />

/// <reference path="../pb_data/types.d.ts" />

declare namespace astroHTML.JSX {
  interface ButtonHTMLAttributes {
    command?: string;
  }
}

/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly MP_ACCESS_TOKEN: string;
  readonly BASE_PATH: string;

  // Bold
  readonly BOLD_API_KEY: string;
  readonly BOLD_SECRET_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}