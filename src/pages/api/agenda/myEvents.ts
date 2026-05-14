import type { APIContext, APIRoute } from "astro";
import { format } from "date-fns";
import { getPendingAppointmentsCount, getConfirmedAppointmentsCount } from "../../../lib/turso/agenda/agenda-db";

export const GET: APIRoute = async (context) => {
    const { userId } = context.locals.auth();
    
    if (!userId) {
        return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const today = format(new Date(), 'yyyy-MM-dd'); // YYYY-MM-DD local time

    const pending = await getPendingAppointmentsCount(userId, today);
    const confirmed = await getConfirmedAppointmentsCount(userId, today);

    return new Response(JSON.stringify({ pending, confirmed }), { status: 200 });
};
