# Configuración de Clerk para Asignación Automática de Roles

Este documento explica cómo configurar Clerk para asignar automáticamente el rol de cliente (org:member) a los nuevos usuarios que se registren en la aplicación.

## Pasos para la Configuración

### 1. Habilitar Organizaciones en Clerk

1. Inicia sesión en el [Dashboard de Clerk](https://dashboard.clerk.dev/).
2. Selecciona tu aplicación.
3. Ve a la sección **Organizations** en el menú lateral.
4. Habilita las organizaciones haciendo clic en **Enable Organizations**.

### 2. Configurar Roles Predeterminados

1. En la sección de **Organizations**, ve a la pestaña **Roles & Permissions**.
2. Verifica que existan los roles predeterminados:
   - `org:admin` (rol de administrador)
   - `org:member` (rol de cliente)
3. Asegúrate de que el rol `org:member` esté configurado como el rol predeterminado para nuevos miembros.

### 3. Configurar Webhook para Nuevos Usuarios

Hemos implementado un endpoint de webhook en `/api/webhook` que procesará los eventos de Clerk. Para configurarlo:

1. En el Dashboard de Clerk, ve a la sección **Webhooks**.
2. Haz clic en **Add Endpoint**.
3. Ingresa la URL de tu webhook: `https://tu-dominio.com/api/webhook`.
4. En **Message Filtering**, selecciona el evento `user.created`.
5. Haz clic en **Create**.

### 4. Configurar Organización Predeterminada (Opcional)

Si deseas que todos los usuarios se unan automáticamente a una organización predeterminada:

1. Crea una organización predeterminada en el Dashboard de Clerk.
2. Utiliza la API de Clerk para asignar automáticamente a los nuevos usuarios a esta organización con el rol de cliente.

## Verificación

Para verificar que la configuración funciona correctamente:

1. Registra un nuevo usuario en la aplicación.
2. Inicia sesión con ese usuario.
3. Verifica que pueda acceder a las rutas de cliente (`/client`).
4. Verifica que no pueda acceder a las rutas de administrador (`/dashboard`).

## Solución de Problemas

Si los usuarios no reciben automáticamente el rol de cliente:

1. Verifica los logs del servidor para asegurarte de que el webhook se está recibiendo correctamente.
2. Comprueba que la organización predeterminada esté configurada correctamente.
3. Verifica que el rol predeterminado para nuevos miembros sea `org:member`.

## Recursos Adicionales

- [Documentación de Clerk sobre Organizaciones](https://clerk.com/docs/organizations/overview)
- [Documentación de Clerk sobre Webhooks](https://clerk.com/docs/webhooks/overview)
- [Documentación de Clerk sobre Roles y Permisos](https://clerk.com/docs/organizations/roles-permissions)