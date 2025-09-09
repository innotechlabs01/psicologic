import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

// Detect entorno
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
const envPath = path.resolve(process.cwd(), envFile);

// Cargar variables
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Variables cargadas desde ${envFile}`);
} else {
  console.warn(`⚠️ Archivo ${envFile} no encontrado. Verifica tu entorno.`);
}

// Validar claves esenciales
const requiredVars = ['PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'CLERK_AFTER_SIGN_OUT_URL'];

const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  throw new Error(`❌ Faltan variables en ${envFile}: ${missingVars.join(', ')}`);
}

// Exportar si necesitas usar en otros módulos
export const env = {
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  clerkSecretKey: process.env.CLERK_SECRET_KEY!,
  afterSignOutUrl: process.env.CLERK_AFTER_SIGN_OUT_URL!,
};
