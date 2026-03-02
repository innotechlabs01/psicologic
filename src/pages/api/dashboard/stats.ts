import type { APIRoute } from 'astro';
import { DashboardService } from '../../../features/dashboard/services/dashboard.service';

export const GET: APIRoute = async () => {
    try {
        const stats = await DashboardService.getStats();
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
