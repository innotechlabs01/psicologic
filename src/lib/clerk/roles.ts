// src/lib/clerk/roles.ts
export async function isAdminRole(orgRole: string | undefined): Promise<boolean> {
  
  const adminRoles = ['org:admin', 'admin'];
  const result = orgRole ? adminRoles.includes(orgRole) : false;
  
  
  return result;
}

export function isClientRole(orgRole: string | undefined): boolean {
  
  const clientRoles = ['org:members', 'org:client', 'client', 'member'];
  const result = orgRole ? clientRoles.includes(orgRole) : false;
  
  return result;
}

// Función adicional para debuggear qué roles están disponibles
export function debugUserRoles(auth: any) {
  const authData = auth();
  
  // Mostrar toda la información disponible
  Object.keys(authData).forEach(key => {
    console.log(`${key}: ${authData[key]}`);
  });
  
  return authData;
}
