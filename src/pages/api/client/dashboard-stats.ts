import type { APIRoute } from 'astro';
import { ClientDashboardService } from '../../../features/client/services/client-dashboard.service';

export const GET: APIRoute = async ({ locals }) => {
    const { userId: clerkUserId } = locals.auth();

    if (!clerkUserId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        const stats = await ClientDashboardService.getClientStats(clerkUserId);
        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500
        });
    }
};
