import { clerkClient } from "@clerk/astro/server";
import { createUserFromClerk } from "../pages/api/webhooks/clerk";
import type { APIContext } from "astro";
// Simple delay utility function
import { delay } from "../lib/utils";

export async function handleUserWithoutRole(context: any, userId: string): Promise<string> {
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
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    };
    console.log("📝 Datos del usuario obtenidos de Clerk:", userData);

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
      });

      if (createdUser) {
        console.log("✅ Usuario creado/actualizado correctamente");
        // Assign default role
        try {
          await clerkClient(context).users.updateUser(userId, {
            publicMetadata: { ...clerkUser.publicMetadata, role: 'org:client' }
          });
          console.log("✅ Rol 'org:client' asignado en Clerk");
          await handlerAddUserToOrg(context, userId);
          // await handleUserPayment(context, userId);
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

const handlerAddUserToOrg = async (context: APIContext, userId: string): Promise<boolean> => {
  // Asociar organización con el usuario (background, sin bloquear middleware)

  try {
    console.log("🧲 Verificando membresía en organización...");

    const memberships = await clerkClient(context).organizations.getOrganizationMembershipList({
      organizationId: "org_32LzH7sL3DcbEJ1GnvOErWFTQkO",
    });

    const alreadyMember = memberships.data.some(m => m.publicUserData?.userId === userId);

    if (!alreadyMember) {
      console.log("➕ Creando membresía para el usuario en la organización...");
      await clerkClient(context).organizations.createOrganizationMembership({
        organizationId: "org_32LzH7sL3DcbEJ1GnvOErWFTQkO",
        userId,
        role: "org:client",
      });
      console.log("✅ Usuario asociado a la organización correctamente");
      return true;
    } else {
      console.log("ℹ️ Usuario ya pertenece a la organización");
      return true;
    }
  } catch (error) {
    console.error("❌ Error asociando usuario a organización:", error);
    return false;
  }
}