import { db } from "../../../lib/turso/client";

export class ClientDashboardService {
    static async getClientStats(clerkUserId: string) {
        try {
            // Get internal user ID first
            const userRes = await db.execute({
                sql: "SELECT id FROM usuarios WHERE clerk_user_id = ?",
                args: [clerkUserId]
            });

            if (!userRes.rows.length) return null;
            const userId = userRes.rows[0].id;

            // Parallel queries for next appointment and open tickets
            const [nextAppointment, activeTickets] = await Promise.all([
                db.execute({
                    sql: "SELECT * FROM agenda WHERE userId = ? AND date >= date('now') AND status = 'confirmed' ORDER BY date ASC, startTime ASC LIMIT 1",
                    args: [userId]
                }),
                db.execute({
                    sql: "SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND estado = 'Abierto'",
                    args: [userId]
                })
            ]);

            return {
                nextAppointment: nextAppointment.rows[0] || null,
                activeTicketsCount: Number(activeTickets.rows[0].count || 0)
            };
        } catch (err) {
            console.error("ClientDashboardService error:", err);
            return null;
        }
    }
}
