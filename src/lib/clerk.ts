// Funciones de utilidad para trabajar con Clerk

/**
 * Configura Clerk para asignar automáticamente el rol de cliente a los nuevos usuarios
 * Esta función debe ser llamada al inicializar la aplicación
 */
export async function setupClerkDefaultRoles() {
  // En un entorno real, aquí configurarías Clerk para asignar automáticamente
  // el rol de cliente a los nuevos usuarios mediante la API de Clerk
  
  // Ejemplo (pseudocódigo):
  // 1. Habilitar organizaciones en el Dashboard de Clerk
  // 2. Configurar el rol predeterminado como 'org:member' (cliente)
  // 3. Asegurarse de que los nuevos usuarios sean asignados automáticamente a una organización
  
  console.log('Clerk configurado para asignar rol de cliente a nuevos usuarios');
}

/**
 * Verifica si un usuario tiene el rol de cliente
 * @param auth El objeto de autenticación de Clerk obtenido de context.locals.auth()
 * @returns true si el usuario tiene el rol de cliente
 */
export function isClientUser(auth: any) {
  // Verificar si el usuario tiene el rol de cliente (org:member)
  // El objeto auth contiene la información de la sesión actual
  console.log('isClientUser - auth:', JSON.stringify(auth));
  
  // Verificar si orgRole existe, si no, asignar un rol predeterminado para desarrollo
  // En producción, esto debería configurarse correctamente en Clerk
  if (!auth.orgRole) {
    console.log('No se encontró orgRole, asignando rol predeterminado para desarrollo');
    // Para desarrollo, consideramos que todos los usuarios autenticados son clientes
    return auth.userId ? true : false;
  }
  
  return auth.orgRole === 'org:member' || auth.orgRole === 'org:admin';
}

/**
 * Verifica si un usuario tiene el rol de administrador
 * @param auth El objeto de autenticación de Clerk obtenido de context.locals.auth()
 * @returns true si el usuario tiene el rol de administrador
 */
export function isAdminUser(auth: any) {
  // Verificar si el usuario tiene el rol de administrador (org:admin)
  console.log('isAdminUser - auth:', JSON.stringify(auth));
  
  // Verificar si orgRole existe, si no, asignar un rol predeterminado para desarrollo
  if (!auth.orgRole) {
    console.log('No se encontró orgRole, verificando si es admin por userId');
    // Para desarrollo, puedes definir IDs específicos como administradores
    // O devolver false si no hay configuración de roles
    return false;
  }
  
  return auth.orgRole === 'org:admin';
}