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
  
  // ePayco
  readonly EPAYCO_PUBLIC_KEY: string;
  readonly EPAYCO_PRIVATE_KEY: string;
  readonly EPAYCO_P_KEY: string;
  readonly EPAYCO_P_CUST_ID_CLIENTE: string;
  readonly IsTest: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}