import type { APIContext } from "astro";
import { clerkClient } from "@clerk/astro/server";
import { createUserFromClerk } from "../pages/api/webhooks/clerk";

export async function handleUserWithoutRole(
  context: APIContext,
  userId: string
): Promise<string> {
  try {
    console.log("🔄 Usuario sin rol - creando/actualizando...");

    const clerk = clerkClient(context);
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      console.error("❌ No se encontró usuario en Clerk");
      return ""; // fallback vacío
    }

    // Crear en base de datos propia
    await createUserFromClerk({
      id: clerkUser.id,
      email_addresses: clerkUser.emailAddresses.map(email => ({
        email_address: email.emailAddress,
        verification: {
          status: email.verification?.status || "unverified",
        },
      })),
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      username: clerkUser.username,
      image_url: clerkUser.imageUrl,
      created_at: clerkUser.createdAt || Date.now(),
      updated_at: clerkUser.updatedAt || Date.now(),
      public_metadata: clerkUser.publicMetadata || {},
      private_metadata: clerkUser.privateMetadata || {},
      unsafe_metadata: clerkUser.unsafeMetadata || {},
    });

    // Asignar rol en Clerk
    try {
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...clerkUser.publicMetadata,
          role: "org:client",
        },
      });
      console.log("✅ Rol 'org:client' asignado en Clerk");
      return "org:client";
    } catch (roleError) {
      console.error("❌ Error asignando rol en Clerk:", roleError);
      return "org:client"; // aunque falle Clerk, devuelve el rol por defecto
    }
  } catch (err) {
    console.error("❌ Error en handleUserWithoutRole:", err);
    return ""; // fallback
  }
}
