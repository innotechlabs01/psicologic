import { db } from "./client";

async function setupRateLimitTable() {
    console.log("Creating rate_limits table...");
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS rate_limits (
                key TEXT PRIMARY KEY,
                count INTEGER DEFAULT 1,
                last_request INTEGER
            );
        `);
        console.log("Table rate_limits created.");
    } catch (e) {
        console.error("Error creating table", e);
    }
}

setupRateLimitTable();
