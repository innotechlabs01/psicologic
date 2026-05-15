import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function setupAgendaTable() {
    try {
        console.log('Creating agenda table...');
        await client.execute(`
      CREATE TABLE IF NOT EXISTS agenda (
        id TEXT PRIMARY KEY,
        title TEXT,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        date TEXT NOT NULL,
        participants TEXT, -- JSON string of participants
        meetingLink TEXT UNIQUE NOT NULL,
        secureToken TEXT UNIQUE NOT NULL, -- For anti-fraud/security video access
        userId TEXT NOT NULL,
        status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create index for faster date lookups
        await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_agenda_date ON agenda(date);
    `);

        // Create table for simple signaling (WebRTC)
        console.log('Creating webrtc_signaling table...');
        await client.execute(`
      CREATE TABLE IF NOT EXISTS webrtc_signaling (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meetingToken TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        sender TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Index for signaling lookups
        await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_token ON webrtc_signaling(meetingToken);
      `);

        console.log('Tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

setupAgendaTable();
