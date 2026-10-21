import { db as client } from "./client";

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

export async function checkRateLimit(ip: string): Promise<{ success: boolean }> {
    const now = Date.now();
    const key = `ip:${ip}`;

    try {
        // Clean old records could be done via a cron or probability, skipping for simplicity/performance in this call
        // We will use UPSERT logic roughly

        // 1. Get current limit
        const result = await client.execute({
            sql: "SELECT count, last_request FROM rate_limits WHERE key = ?",
            args: [key]
        });

        if (result.rows.length === 0) {
            // First request
            await client.execute({
                sql: "INSERT INTO rate_limits (key, count, last_request) VALUES (?, 1, ?)",
                args: [key, now]
            });
            return { success: true };
        }

        const row = result.rows[0];
        const lastRequest = row.last_request as number;
        const count = row.count as number;

        if (now - lastRequest > WINDOW_SIZE_MS) {
            // Window reset
            await client.execute({
                sql: "UPDATE rate_limits SET count = 1, last_request = ? WHERE key = ?",
                args: [now, key]
            });
            return { success: true };
        } else {
            // In window
            if (count >= MAX_REQUESTS) {
                return { success: false };
            }
            // Increment
            await client.execute({
                sql: "UPDATE rate_limits SET count = count + 1 WHERE key = ?",
                args: [key]
            });
            return { success: true };
        }

    } catch (e) {
        console.error("Rate limit error", e);
        // Fail open if DB fails? Or closed. Let's fail open to not block legit users if DB hiccups
        return { success: true };
    }
}
