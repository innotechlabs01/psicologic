import { createClient } from '@libsql/client';

// Use environment variables or rely on framework injection if needed
const client = createClient({
    url: process.env.TURSO_DATABASE_URL || import.meta.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || import.meta.env.TURSO_AUTH_TOKEN
});

export interface AgendaEvent {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date: string;
    participants: any;
    meetingLink: string;
    secureToken: string;
    userId: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    created_at?: string;
}

// --- AGENDA CRUD ---

export async function createEvent(event: Omit<AgendaEvent, 'created_at' | 'updated_at'>): Promise<AgendaEvent | null> {
    try {
        const { id, title, startTime, endTime, date, participants, meetingLink, secureToken, userId, status } = event;

        // 1. Check for availability (Anti-fraud/Race condition check)
        // Check if there is already a confirmed event at this time/date
        const conflict = await client.execute({
            sql: `SELECT id FROM agenda WHERE date = ? AND startTime = ? AND status = 'confirmed'`,
            args: [date, startTime]
        });

        if (conflict.rows.length > 0) {
            throw new Error("SLOT_ALREADY_BOOKED");
        }

        const result = await client.execute({
            sql: `
                INSERT INTO agenda (id, title, startTime, endTime, date, participants, meetingLink, secureToken, userId, status)
                VALUES (:id, :title, :startTime, :endTime, :date, :participants, :meetingLink, :secureToken, :userId, :status)
            `,
            args: {
                id,
                title,
                startTime,
                endTime,
                date,
                participants: JSON.stringify(participants),
                meetingLink,
                secureToken,
                userId,
                status
            }
        });

        if (result.rowsAffected > 0) {
            return event;
        }
        return null;
    } catch (error) {
        console.error("Error creating event:", error);
        throw error;
    }
}

export async function getEventsByDateRange(startDate: string, endDate: string): Promise<AgendaEvent[]> {
    try {
        const result = await client.execute({
            sql: `SELECT * FROM agenda WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
            args: [startDate, endDate]
        });

        return result.rows.map(row => ({
            ...row,
            participants: JSON.parse(row.participants as string)
        })) as unknown as AgendaEvent[];
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function getEventByToken(token: string): Promise<AgendaEvent | null> {
    try {
        const result = await client.execute({
            sql: `SELECT * FROM agenda WHERE secureToken = ?`,
            args: [token]
        });

        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                ...row,
                participants: JSON.parse(row.participants as string)
            } as unknown as AgendaEvent;
        }
        return null;
    } catch (error) {
        console.error("Error fetching event by token:", error);
        return null;
    }
}

// --- SIGNALING HELPER (DB-based WebRTC) ---

export async function addSignalingMessage(meetingToken: string, type: string, payload: any, sender: 'host' | 'client') {
    try {
        await client.execute({
            sql: `INSERT INTO agenda_signaling (meetingToken, type, payload, sender) VALUES (?, ?, ?, ?)`,
            args: [meetingToken, type, JSON.stringify(payload), sender]
        });
        return true;
    } catch (error) {
        console.error("Error adding signaling:", error);
        return false;
    }
}

export async function getSignalingMessages(meetingToken: string, afterId: number = 0) {
    try {
        const result = await client.execute({
            sql: `SELECT * FROM agenda_signaling WHERE meetingToken = ? AND id > ? ORDER BY id ASC`,
            args: [meetingToken, afterId]
        });

        return result.rows.map(row => ({
            ...row,
            payload: JSON.parse(row.payload as string)
        }));
    } catch (error) {
        console.error("Error getting signaling:", error);
        return [];
    }
}
