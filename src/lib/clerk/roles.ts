// src/lib/clerk/roles.ts
export async function isAdminRole(orgRole: string | undefined): Promise<boolean> {
  console.log(`🔍 Verificando rol admin: "${orgRole}"`);
  
  const adminRoles = ['org:admin', 'admin'];
  const result = orgRole ? adminRoles.includes(orgRole) : false;
  
  console.log(`   📋 Roles válidos para admin: ${adminRoles.join(', ')}`);
  console.log(`   ✅ Resultado: ${result}`);
  
  return result;
}

export function isClientRole(orgRole: string | undefined): boolean {
  console.log(`🔍 Verificando rol client: "${orgRole}"`);
  
  const clientRoles = ['org:members', 'org:client', 'client', 'member'];
  const result = orgRole ? clientRoles.includes(orgRole) : false;
  
  console.log(`   📋 Roles válidos para client: ${clientRoles.join(', ')}`);
  console.log(`   ✅ Resultado: ${result}`);
  
  return result;
}

// Función adicional para debuggear qué roles están disponibles
export function debugUserRoles(auth: any) {
  const authData = auth();
  
  console.log("\n🔍 DEBUG DE ROLES COMPLETO:");
  console.log("=====================================");
  
  // Mostrar toda la información disponible
  Object.keys(authData).forEach(key => {
    console.log(`${key}: ${authData[key]}`);
  });
  
  console.log("\n🏷️  ANÁLISIS DE ROLES:");
  console.log(`orgRole: ${authData.orgRole}`);
  console.log(`userId: ${authData.userId}`);
  console.log(`sessionId: ${authData.sessionId}`);
  console.log(`orgId: ${authData.orgId}`);
  
  return authData;
}
