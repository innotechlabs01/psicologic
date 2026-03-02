import { db as client } from "../client";

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
        ;
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

export async function getEventsByDateRange(startDate: string, endDate: string, userId: string): Promise<AgendaEvent[]> {
    try {
        const result = await client.execute({
            sql: `SELECT * FROM agenda WHERE date >= ? AND date <= ? AND userId = ? AND status != 'cancelled'`,
            args: [startDate, endDate, userId]
        });

        return result.rows.map((row: any) => ({
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


export async function deleteEvent(id: string, userId: string): Promise<boolean> {
    try {
        const result = await client.execute({
            sql: `DELETE FROM agenda WHERE id = ? AND userId = ?`,
            args: [id, userId]
        });
        return result.rowsAffected > 0;
    } catch (error) {
        console.error("Error deleting event:", error);
        return false;
    }
}

export async function updateEvent(event: Partial<AgendaEvent> & { id: string, userId: string }): Promise<boolean> {
    try {
        const { id, userId, title, startTime, endTime, date, participants } = event;

        const result = await client.execute({
            sql: `
                UPDATE agenda 
                SET title = ?, startTime = ?, endTime = ?, date = ?, participants = ?
                WHERE id = ? AND userId = ?
            `,
            args: [
                title,
                startTime,
                endTime,
                date,
                JSON.stringify(participants),
                id,
                userId
            ]
        });

        return result.rowsAffected > 0;
    } catch (error) {
        console.error("Error updating event:", error);
        return false;
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

        return result.rows.map((row: any) => ({
            ...row,
            payload: JSON.parse(row.payload as string)
        }));
    } catch (error) {
        console.error("Error getting signaling:", error);
        return [];
    }
}

// --- SETTINGS & VALIDATION ---

export interface AgendaSettings {
    id: string;
    monday_start_at: string;
    monday_end_at: string;
    tuesday_start_at: string;
    tuesday_end_at: string;
    wednesday_start_at: string;
    wednesday_end_at: string;
    thurday_start_at: string; // Misspelled in DB
    thursday_end_at: string;
    friday_start_at: string;
    friday_end_at: string;
    saturday_start_at: string;
    saturday_end_at: string;
    sunday_start_at: string;
    sunday_end_at: string;
    userId: string;
}

export async function getAgendaSettings(userId: string): Promise<AgendaSettings | null> {
    try {
        const result = await client.execute({
            sql: `SELECT * FROM settings_agend_time WHERE userId = ? LIMIT 1`,
            args: [userId]
        });

        if (result.rows.length > 0) {
            return result.rows[0] as unknown as AgendaSettings;
        }
        return null;
    } catch (error) {
        console.error("Error fetching agenda settings:", error);
        return null;
    }
}

export function isTimeEnabled(dateStr: string, startTime: string, settings: AgendaSettings): boolean {
    const date = new Date(dateStr);
    // getDay returns 0 for Sunday, 1 for Monday, etc.
    const dayIndex = date.getUTCDay(); // Use UTC to avoid timezone shifts if dateStr is simple 'YYYY-MM-DD'

    let startLimit = '';
    let endLimit = '';

    switch (dayIndex) {
        case 1: // Monday
            startLimit = settings.monday_start_at;
            endLimit = settings.monday_end_at;
            break;
        case 2: // Tuesday
            startLimit = settings.tuesday_start_at;
            endLimit = settings.tuesday_end_at;
            break;
        case 3: // Wednesday
            startLimit = settings.wednesday_start_at;
            endLimit = settings.wednesday_end_at;
            break;
        case 4: // Thursday
            // Handle DB typo
            startLimit = settings.thurday_start_at;
            endLimit = settings.thursday_end_at;
            break;
        case 5: // Friday
            startLimit = settings.friday_start_at;
            endLimit = settings.friday_end_at;
            break;
        case 6: // Saturday
            startLimit = settings.saturday_start_at;
            endLimit = settings.saturday_end_at;
            break;
        case 0: // Sunday
            startLimit = settings.sunday_start_at;
            endLimit = settings.sunday_end_at;
            break;
    }

    if (!startLimit || !endLimit || startLimit === '' || endLimit === '') {
        // If times are empty, assume closed
        return false;
    }

    // Simple string comparison for 'HH:MM' works lexicographically
    return startTime >= startLimit && startTime < endLimit;
}

export async function getTomorrowEvents(): Promise<AgendaEvent[]> {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const result = await client.execute({
            sql: `SELECT * FROM agenda WHERE date = ? AND status = 'confirmed'`,
            args: [tomorrowStr]
        });

        return result.rows.map((row: any) => ({
            ...row,
            participants: JSON.parse(row.participants as string)
        })) as unknown as AgendaEvent[];
    } catch (error) {
        console.error("Error fetching tomorrow events:", error);
        return [];
    }
}
