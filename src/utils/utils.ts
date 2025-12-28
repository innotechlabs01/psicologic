import { clerkClient } from "@clerk/astro/server";
import { createUserFromAdminClerk, createUserFromClerk } from "../pages/api/webhooks/clerk";
import type { APIContext } from "astro";
import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
// Simple delay utility function
import { delay } from "../lib/utils";
import { is } from "date-fns/locale";
// Initialize Supabase client with service role key
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export async function handleUserWithoutRole(context: any, userId: string, isGameLogin: boolean): Promise<string> {
  try {

    console.log("🔄 Usuario sin rol - intentando crear/actualizar en base de datos...");

    // Attempt to fetch user with retry logic
    let clerkUser;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        clerkUser = await clerkClient(context).users.getUser(userId);
        break;
      } catch (error) {
        if ((error as { status?: number; retryAfter?: number }).status === 429 &&
          (error as { status?: number; retryAfter?: number }).retryAfter) {
          console.warn(`⚠️ Rate limit hit, retrying after ${(error as { status?: number; retryAfter?: number }).retryAfter}s (attempt ${attempt})`);
          await delay((error as { status?: number; retryAfter?: number }).retryAfter ?? 1 * 1000);
        } else {
          throw error;
        }
      }
    }

    if (!clerkUser) {
      console.error("❌ No se pudo obtener usuario de Clerk");
      return "null";
    }

    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      // firstName: clerkUser.firstName, // Minimal logging
      // lastName: clerkUser.lastName
    };
    console.log("📝 Datos del usuario obtenidos de Clerk (Sanitized)");

    // Create or update user in database
    try {
      const createdUser = await createUserFromClerk({
        id: clerkUser.id,
        email_addresses: clerkUser.emailAddresses.map(email => ({
          email_address: email.emailAddress,
          verification: { status: email.verification?.status || 'unverified' }
        })),
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        username: clerkUser.username,
        image_url: clerkUser.imageUrl,
        created_at: clerkUser.createdAt || Date.now(),
        updated_at: clerkUser.updatedAt || Date.now(),
        public_metadata: clerkUser.publicMetadata || {},
        private_metadata: clerkUser.privateMetadata || {},
        unsafe_metadata: clerkUser.unsafeMetadata || {}
      }, context, isGameLogin);

      if (createdUser) {
        console.log("✅ Usuario creado/actualizado correctamente");
        // Assign default role
        try {

          if (isGameLogin) {
            await clerkClient(context).users.updateUser(userId, {
              publicMetadata: { ...clerkUser.publicMetadata, role: 'org:moderator' }
            });
          } else {
            await clerkClient(context).users.updateUser(userId, {
              publicMetadata: { ...clerkUser.publicMetadata, role: 'org:client' }
            });
          }
          console.log("✅ Rol 'org:client' asignado en Clerk");
          await handlerAddUserToOrg(context, userId, isGameLogin);
          await handlerInitializePaymentTrial(context, userId)
          // await handleUserPayment(context, userId);
          if (isGameLogin) {
            return 'org:moderator';
          }

          return 'org:client';
        } catch (roleError) {
          console.error("❌ Error asignando rol en Clerk:", roleError);
          return 'org:client'; // Fallback to default role
        }
      }
    } catch (dbError) {
      console.error("❌ Error en createUserFromClerk:", dbError);
      if ((dbError as { code?: string }).code === 'PGRST116') {
        console.warn("⚠️ No rows returned, attempting to create new user...");
        // Add logic to create a new user record if it doesn't exist
      }
      return "null";
    }

    return "null";
  } catch (error) {
    console.error("❌ Error manejando usuario sin rol:", error);
    return "null";
  }
}

export async function handleInsertUsersAdmin(context: any, userId: string): Promise<string> {
  try {
    console.log("🔄 Usuario crear/actualizar en base de datos...");

    // Attempt to fetch user with retry logic
    let clerkUser;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        clerkUser = await clerkClient(context).users.getUser(userId);
        break;
      } catch (error) {
        if ((error as { status?: number; retryAfter?: number }).status === 429 &&
          (error as { status?: number; retryAfter?: number }).retryAfter) {
          console.warn(`⚠️ Rate limit hit, retrying after ${(error as { status?: number; retryAfter?: number }).retryAfter}s (attempt ${attempt})`);
          await delay((error as { status?: number; retryAfter?: number }).retryAfter ?? 1 * 1000);
        } else {
          throw error;
        }
      }
    }

    if (!clerkUser) {
      console.error("❌ No se pudo obtener usuario de Clerk");
      return "null";
    }

    // console.log("📝 Datos del usuario obtenidos de Clerk:", userData); // Sanitized

    // Create or update user in database
    try {
      const createdUser = await createUserFromAdminClerk({
        id: clerkUser.id,
        email_addresses: clerkUser.emailAddresses.map(email => ({
          email_address: email.emailAddress,
          verification: { status: email.verification?.status || 'unverified' }
        })),
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        username: clerkUser.username,
        image_url: clerkUser.imageUrl,
        created_at: clerkUser.createdAt || Date.now(),
        updated_at: clerkUser.updatedAt || Date.now(),
        public_metadata: clerkUser.publicMetadata || {},
        private_metadata: clerkUser.privateMetadata || {},
        unsafe_metadata: clerkUser.unsafeMetadata || {}
      });

      if (createdUser) {
        console.log("✅ Usuario creado/actualizado correctamente");
        // Assign default role
        try {
          console.log("✅ User create org:admin");
          // await handleUserPayment(context, userId);
          return 'org:admin';
        } catch (roleError) {
          console.error("❌ Error asignando rol en Clerk:", roleError);
          return 'null'; // Fallback to default role
        }
      }
    } catch (dbError) {
      console.error("❌ Error en createUserFromClerk:", dbError);
      if ((dbError as { code?: string }).code === 'PGRST116') {
        console.warn("⚠️ No rows returned, attempting to create new user...");
        // Add logic to create a new user record if it doesn't exist
      }
      return "null";
    }

    return "null";
  } catch (error) {
    console.error("❌ Error manejando usuario sin rol:", error);
    return "null";
  }
}

const handlerAddUserToOrg = async (context: APIContext, userId: string, isGameLogin: boolean): Promise<boolean> => {
  // Asociar organización con el usuario (background, sin bloquear middleware)

  let alreadyMember = true;
  let orgId = "";
  try {

    if (isGameLogin) {
      orgId = import.meta.env.PUBLIC_DEFAULT_GAME_ID || "org_37BFVsUdkH9fDa7TRcpKjFprc0Z"; // Use env or fallback
    } else {
      orgId = import.meta.env.PUBLIC_CLERK_ORG_ID || "org_32LzH7sL3DcbEJ1GnvOErWFTQkO"; // Use env or fallback
    }

    const result = await clerkClient(context).organizations.getOrganizationList();
    console.log("Organization List:", result);

    const memberships = await clerkClient(context).organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    alreadyMember = memberships.data.some(m => m.publicUserData?.userId === userId);
    const nameRole = isGameLogin ? 'org:moderator' : 'org:client';

    if (!alreadyMember) {
      await clerkClient(context).organizations.createOrganizationMembership({
        organizationId: orgId,
        userId,
        role: nameRole,
      });
    }
    return true;
  } catch (error) {
    console.log('⚠️ Error adding user to organization:', error);
    return false;
  }
}

/**
 * 🚩 NUEVA FUNCIÓN: Registra el periodo de prueba de 15 días + 5 días de prórroga.
 * El estado se establece en 'trial'.
 */
const handlerInitializePaymentTrial = async (context: APIContext, userId: string): Promise<void> => {
  try {

    // validamos la autenticacion
    const clerkUser = await clerkClient(context).users.getUser(userId);
    if (!clerkUser) {
      throw clerkUser;
    }

    // 15 días de prueba (Fecha límite de pago)
    const nextPaymentDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    // 5 días de prórroga (Fecha de bloqueo total)
    const blockedPaymentDate = new Date(Date.now() + (15 + 5) * 24 * 60 * 60 * 1000).toISOString();

    console.log(`Setting up 15-day trial for user ${userId}. Payment due: ${nextPaymentDate}, Block date: ${blockedPaymentDate}`);

    // Eliminado código de excepciones hardcoded
    // if (userId === "..." || userId === "...") { ... } 


    // DEBUG: pausa aquí si se ejecuta el proceso con un inspector (ej. `node --inspect`)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      ;
    }
    await client.execute(
      `
        INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        uuidv4(), // Usar un ID de transacción único
        userId,
        0, // Monto 0 para la prueba
        'trial', // Estado inicial de prueba
        new Date(), // Fecha de inicio de la prueba
        nextPaymentDate,
        blockedPaymentDate,
        new Date()
      ]
    );


    // Asegurar que el usuario esté marcado como 'approved' o 'active' inicialmente
    // DEBUG: pausa aquí antes del UPDATE si se adjunta un inspector
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      ;
    }
    const result = await client.execute(
      `
        UPDATE usuarios
        SET status = ?
        WHERE clerk_user_id = ?
      `,
      [
        'active', // Usar 'active' para indicar que está usando la app
        userId
      ]
    );

    if (result) {
      console.error('❌ Error al actualizar estado del usuario a "active":', result);
    }

    console.log("✅ Registro de prueba de pago inicial completado.");

  } catch (error) {
    console.error(`Se evidencia un error en handlerInitializePaymentTrial:`, error);
    // No lanzar error para no bloquear el login, pero registrarlo.
    throw error;
  }
}
