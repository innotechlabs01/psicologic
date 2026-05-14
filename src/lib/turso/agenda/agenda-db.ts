import { createClient } from '@libsql/client';

// Use environment variables or rely on framework injection if needed
const client = createClient({
    url: import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || "",
    authToken: import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || ""
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
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
        console.log('[DB] Fetching events:', { startDate, endDate, userId });
        
        const result = await client.execute({
            sql: `SELECT * FROM agenda WHERE date >= ? AND date <= ? AND userId = ? AND status != 'cancelled'`,
            args: [startDate, endDate, userId]
        });

        console.log('[DB] Query result rows:', result.rows.length);

        return result.rows.map(row => {
            try {
                return {
                    ...row,
                    participants: typeof row.participants === 'string' 
                        ? JSON.parse(row.participants) 
                        : row.participants || {}
                } as unknown as AgendaEvent;
            } catch (parseError) {
                console.error('[DB] Error parsing participants for row:', { row, parseError });
                return {
                    ...row,
                    participants: {}
                } as unknown as AgendaEvent;
            }
        });
    } catch (error) {
        console.error('[DB] Error fetching events:', { error, startDate, endDate, userId });
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

        const sql = "UPDATE agenda SET title = ?, startTime = ?, endTime = ?, date = ?, participants = ? WHERE id = ? AND userId = ?";
        const args = [
            (title ?? null) as string | null,
            (startTime ?? null) as string | null,
            (endTime ?? null) as string | null,
            (date ?? null) as string | null,
            (participants !== undefined ? JSON.stringify(participants) : null) as string | null,
            id as string,
            userId as string
        ];

        const result = await client.execute({ sql, args });

        return result.rowsAffected > 0;
    } catch (error) {
        console.error("Error updating event:", error);
        return false;
    }
}

// --- SIGNALING HELPER (DB-based WebRTC) ---

export async function addSignalingMessage(meetingToken: string, type: string, payload: any, sender: 'host' | 'client') {
    try {
        if (!meetingToken || !type || !payload || !sender) {
            console.error("Missing fields in addSignalingMessage");
            return false;
        }

        const payloadStr = JSON.stringify(payload);

        // Manual cleanup to ensure it's a valid string for the DB
        const sql = "INSERT INTO webrtc_signals (meetingToken, type, payload, sender) VALUES (?, ?, ?, ?)";
        const args = [meetingToken as string, type as string, payloadStr as string, sender as string];

        await client.execute({ sql, args });
        return true;
    } catch (error) {
        console.error("DB Error adding signaling:", error);
        // Throw the error so the API route can catch it and show details
        throw error;
    }
}

export async function getSignalingMessages(meetingToken: string, afterId: number = 0) {
    try {
        const result = await client.execute({
            sql: `SELECT * FROM webrtc_signals WHERE meetingToken = ? AND id > ? ORDER BY id ASC`,
            args: [meetingToken, afterId]
        });

        return result.rows.map(row => {
            try {
                return {
                    ...row,
                    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
                };
            } catch (e) {
                console.error("Error parsing signaling payload:", row.id);
                return null;
            }
        }).filter(msg => msg !== null);
    } catch (error) {
        console.error("DB Error getting signaling:", error);
        return [];
    }
}

export async function clearSignalingRoom(meetingToken: string) {
    try {
        if (!meetingToken) return false;
        const sql = "DELETE FROM webrtc_signals WHERE meetingToken = ?";
        await client.execute({ sql, args: [meetingToken] });
        return true;
    } catch (error) {
        console.error("DB Error clearing signaling room:", error);
        return false;
    }
}

export async function confirmEvent(token: string): Promise<boolean> {
    try {
        const result = await client.execute({
            sql: `UPDATE agenda SET status = 'confirmed' WHERE secureToken = ?`,
            args: [token]
        });
        return result.rowsAffected > 0;
    } catch (error) {
        console.error("Error confirming event:", error);
        return false;
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

export async function getTotalAppointmentsCount(userId: string): Promise<number> {
    try {
        console.log('Querying total appointments for userId:', userId);
        const result = await client.execute({
            sql: `SELECT COUNT(*) as count FROM agenda WHERE userId = ?`,
            args: [userId]
        });
        console.log('Total query result:', result.rows);
        const count = result.rows[0]?.count || 0;
        console.log('Total count:', count);
        return count as number;
    } catch (error) {
        console.error("Error fetching total appointments count:", error);
        return 0;
    }
}

export async function getPendingAppointmentsCount(userId: string, fromDate: string): Promise<number> {
    try {
        console.log('Querying pending for userId:', userId, 'fromDate:', fromDate);
        const result = await client.execute({
            sql: `SELECT COUNT(*) as count FROM agenda WHERE userId = ? AND status = 'pending' AND date >= ?`,
            args: [userId, fromDate]
        });
        console.log('Pending query result:', result.rows);
        const count = result.rows[0]?.count || 0;
        console.log('Pending count:', count);
        return count as number;
    } catch (error) {
        console.error("Error fetching pending appointments count:", error);
        return 0;
    }
}

export async function getConfirmedAppointmentsCount(userId: string, fromDate: string): Promise<number> {
    try {
        console.log('Querying confirmed for userId:', userId, 'fromDate:', fromDate);
        const result = await client.execute({
            sql: `SELECT COUNT(*) as count FROM agenda WHERE userId = ? AND status = 'confirmed' AND date >= ?`,
            args: [userId, fromDate]
        });
        console.log('Confirmed query result:', result.rows);
        const count = result.rows[0]?.count || 0;
        console.log('Confirmed count:', count);
        return count as number;
    } catch (error) {
        console.error("Error fetching confirmed appointments count:", error);
        return 0;
    }
}

export async function getNextAppointment(userId: string): Promise<AgendaEvent | null> {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Querying next appointment for userId:', userId, 'fromDate:', today);
        
        // First try to get confirmed appointment
        let result = await client.execute({
            sql: `SELECT * FROM agenda 
                   WHERE userId = ? AND status = 'confirmed' AND date >= ? 
                   ORDER BY date ASC, startTime ASC 
                   LIMIT 1`,
            args: [userId, today]
        });
        
        // If no confirmed, try pending
        if (result.rows.length === 0) {
            console.log('[DB] No confirmed appointments found, trying pending...');
            result = await client.execute({
                sql: `SELECT * FROM agenda 
                       WHERE userId = ? AND status = 'pending' AND date >= ? 
                       ORDER BY date ASC, startTime ASC 
                       LIMIT 1`,
                args: [userId, today]
            });
        }
        
        console.log('[DB] Next appointment query result:', {
            found: result.rows.length > 0,
            totalRows: result.rows.length,
            appointment: result.rows.length > 0 ? {
                id: result.rows[0].id,
                title: result.rows[0].title,
                date: result.rows[0].date,
                startTime: result.rows[0].startTime,
                status: result.rows[0].status
            } : null
        });
        
        if (result.rows.length === 0) {
            console.log('[DB] No upcoming appointments found');
            return null;
        }
        
        const row = result.rows[0];
        return {
            ...row,
            participants: typeof row.participants === 'string' 
                ? JSON.parse(row.participants) 
                : row.participants || {}
        } as unknown as AgendaEvent;
    } catch (error) {
        console.error("Error fetching next appointment:", error);
        return null;
    }
}