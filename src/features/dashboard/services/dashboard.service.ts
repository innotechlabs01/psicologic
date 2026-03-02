import { db } from "../../../lib/turso/client";
import type { DashboardStats } from "../types";

export class DashboardService {
    static async getStats(): Promise<DashboardStats> {
        try {
            const [userRes, openTicketsRes, activeChatsRes, closedChatsRes] = await Promise.all([
                db.execute('SELECT COUNT(*) as count FROM admin_notifications WHERE type = "new_user"'),
                db.execute('SELECT COUNT(*) as count FROM tickets WHERE estado = "Abierto"'),
                db.execute('SELECT COUNT(*) as count FROM tickets WHERE estado = "Abierto"'),
                db.execute('SELECT COUNT(*) as count FROM tickets WHERE estado = "Cerrado"')
            ]);

            return {
                countUser: Number(userRes.rows[0].count || 0),
                countTicket: Number(openTicketsRes.rows[0].count || 0),
                countChatActive: Number(activeChatsRes.rows[0].count || 0),
                countChatClose: Number(closedChatsRes.rows[0].count || 0),
            };
        } catch (err) {
            console.error("DashboardService.getStats error:", err);
            return {
                countUser: 0,
                countTicket: 0,
                countChatActive: 0,
                countChatClose: 0,
            };
        }
    }
}
