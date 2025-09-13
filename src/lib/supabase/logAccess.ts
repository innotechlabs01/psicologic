// src/lib/supabase/logAccess.ts
import { createClient } from '@supabase/supabase-js';

// Asegúrate de usar la SERVICE ROLE KEY, no la anon key
const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ MUY IMPORTANTE: Usar SERVICE ROLE
);

interface LogAccessParams {
  userId: string;
  email?: string;
  role?: string;
  ip?: string;
  route: string;
}

export async function logAccess(params: LogAccessParams) {
  console.log("📝 Intentando registrar acceso:", params);
  
  try {
    // Verificar que tenemos los datos mínimos necesarios
    if (!params.userId || !params.route) {
      console.warn("⚠️ Datos insuficientes para log:", params);
      return false;
    }

    const logData = {
      user_id: params.userId,
      email: params.email || null,
      role: params.role || null,
      ip: params.ip || null,
      route: params.route,
      created_at: new Date().toISOString()
    };

    console.log("📤 Enviando datos a Supabase:", logData);

    const { data, error } = await supabase
      .from('access_logs')
      .insert(logData)
      .select();

    if (error) {
      console.error("❌ Error insertando log:", error);
      
      // Información adicional para debugging
      console.error("Detalles del error:");
      console.error("- Code:", error.code);
      console.error("- Message:", error.message);
      console.error("- Details:", error.details);
      console.error("- Hint:", error.hint);
      
      return false;
    }

    console.log("✅ Log registrado exitosamente:", data);
    return true;

  } catch (error) {
    console.error("💥 Error inesperado en logAccess:", error);
    return false;
  }
}

// Función alternativa que no bloquea si falla el log
export async function safeLogAccess(params: LogAccessParams) {
  try {
    await logAccess(params);
  } catch (error) {
    // Log el error pero no interrumpir el flujo principal
    console.warn("⚠️ Error al registrar acceso (continuando):", error);
  }
}

// Función para verificar la conexión a Supabase
export async function testSupabaseConnection() {
  console.log("🔍 Probando conexión a Supabase...");
  
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error("❌ Error conectando a Supabase:", error);
      return false;
    }
    
    console.log("✅ Conexión a Supabase OK");
    return true;
  } catch (error) {
    console.error("💥 Error de conexión:", error);
    return false;
  }
}