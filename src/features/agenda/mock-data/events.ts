export interface Event {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date: string;
    participants: string[];
    meetingLink?: string;
    timezone?: string;
}

export const events: Event[] = [];

export function getEventsForDate(date: string): Event[] {
    return events.filter((event) => event.date === date);
}

export function getEventsForWeek(startDate: Date): Event[] {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
    });
}

export function getTodayEvents(): Event[] {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

    const baseWeekStart = new Date("2024-02-04");
    const baseDayOfWeek =
        baseWeekStart.getDay() === 0 ? 6 : baseWeekStart.getDay() - 1;

    return events.filter((event) => {
        const eventDate = new Date(event.date);
        const eventDayOfWeek =
            eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
        return eventDayOfWeek === dayOfWeek;
    });
}

function normalizeParticipants(input: any): string[] {
    if (!input) return [];

    // If it's already a flat array of strings
    if (Array.isArray(input)) {
        try {
            // Flatten one level if nested arrays exist
            const flat = (input as any[]).flat ? (input as any[]).flat() : (input as any[]);
            return flat
                .map((p: any) => {
                    if (!p) return '';
                    if (typeof p === 'string') return p;
                    if (Array.isArray(p)) return p.join(', ');
                    if (typeof p === 'object') return p.name || p.email || JSON.stringify(p);
                    return String(p);
                })
                .map((s: string) => s.trim())
                .filter(Boolean);
        } catch (e) {
            console.warn('normalizeParticipants: failed to flatten', e);
        }
    }

    // If it's an object like { name, email }
    if (typeof input === 'object') {
        const name = (input as any).name;
        const email = (input as any).email;
        return [name || email].filter(Boolean);
    }

    // Fallback: coerce to string
    return [String(input)].filter(Boolean);
}

export function addEvent(event: Omit<Event, "id"> | any): void {
    // Accept flexible shapes and normalize fields for the mock store
    const newId = String(events.length + 1);

    const participants = normalizeParticipants(event.participants);

    const ev: Event = {
        id: newId,
        title: String(event.title || 'Reserva'),
        startTime: String(event.startTime || event.start_time || '00:00'),
        endTime: String(event.endTime || event.end_time || '00:00'),
        date: String(event.date),
        participants,
        meetingLink: event.meetingLink || event.meeting_link || undefined,
        timezone: event.timezone || undefined,
    };

    events.push(ev);
}
