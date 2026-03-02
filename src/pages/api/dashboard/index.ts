import type { APIRoute } from 'astro';
import { DashboardService } from '../../../features/dashboard/services/dashboard.service';

export const GET: APIRoute = async () => {
    const stats = await DashboardService.getStats();
    return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}