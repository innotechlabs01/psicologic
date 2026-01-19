import { format, addMinutes, parse } from 'date-fns';

interface CalendarEventParams {
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:mm
    endTimeType?: 'duration' | 'time'; // logical helper
    durationMinutes?: number;
    endTime?: string;   // HH:mm
    title: string;
    description: string;
    location: string;
    url?: string;
}

// Format date to YYYYMMDDTHHmmssZ (UTC approx for simplicity or local time + Z if treating as floating)
// For broader compatibility without timezone headaches, often using "YYYYMMDDTHHmmss" (Floating) is safer if we don't know user TZ, 
// but email clients usually prefer explicit TZ or UTC. 
// For this MVP, we will assume the input time is local to the user/system and format it as a floating time or just simple string for ICS.
// Google Link expects YYYYMMDDTHHmmss / YYYYMMDDTHHmmss in UTC or user time.

function formatToICSDate(dateStr: string, timeStr: string): string {
    // dateStr: 2024-03-20, timeStr: 10:00
    // Returns: 20240320T100000
    return `${dateStr.replace(/-/g, '')}T${timeStr.replace(/:/g, '')}00`;
}

export function generateICSContent({ date, startTime, endTime, title, description, location, url }: CalendarEventParams): string {
    // Calculate logical end time if needed, though for now we rely on endTime being passed or default 1h
    const startDateTime = formatToICSDate(date, startTime);
    const endDateTime = endTime ? formatToICSDate(date, endTime) : formatToICSDate(date, "00:00"); // Fallback if missing

    // Basic ICS structure
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Psicologic//Agenda//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${startDateTime}
DTEND:${endDateTime}
DESCRIPTION:${description}
LOCATION:${location}
URL:${url || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n').trim();
}

export function generateGoogleCalendarLink({ date, startTime, endTime, title, description, location }: CalendarEventParams): string {
    const startDateTime = formatToICSDate(date, startTime);
    const endDateTime = endTime ? formatToICSDate(date, endTime) : formatToICSDate(date, "00:00");

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${startDateTime}/${endDateTime}`,
        details: description,
        location: location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
