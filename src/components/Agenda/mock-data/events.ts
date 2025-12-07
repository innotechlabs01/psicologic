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

export function addEvent(event: Omit<Event, "id">): void {
    const newId = String(events.length + 1);
    events.push({
        ...event,
        id: newId,
    });
}
