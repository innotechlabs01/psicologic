"use client";

import { format } from "date-fns";
import { useCalendarStore } from "../store/calendar-store";
import { addEvent, type Event } from "../mock-data/events";
import { useEffect, useRef, useState } from "react";
import { EventSheet } from "./event-sheet";
import { CalendarWeekHeader } from "./calendar-week-header";
import { CalendarHoursColumn } from "./calendar-hours-column";
import { CalendarDayColumn } from "./calendar-day-column";
import { getCurrentTimePosition } from "./calendar-utils";
import { useAgendaCache } from "../../../hooks/useAgendaCache";

export function CalendarView() {
    const { goToNextWeek, goToPreviousWeek, getWeekDays, getCurrentWeekEvents, setEvents } =
        useCalendarStore();
    const { refreshKey, currentWeekStart, applyFilters } = useCalendarStore();
    const weekDays = getWeekDays();
    const events = getCurrentWeekEvents();

    // Auto-scroll logic

    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Cache Hook
    const { getCachedEvents, setCachedEvents } = useAgendaCache();

    const today = new Date();

    // Track first mount so initial load doesn't show the inline skeleton
    const firstLoadRef = useRef(true);

    const fetchAgenda = async (showSkeleton = false) => {
        try {

            if (showSkeleton) {
                // Notify SkeletonManager for agenda to show overlay
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('agenda:fetch-start'));
                setLoading(true);
            }

            // 1. Check Cache first
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

            const cachedData = getCachedEvents(today, end);

            if (cachedData) {
                console.log("Using cached agenda data");
                setEvents(cachedData);
                if (showSkeleton) {
                    setLoading(false);
                    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
                }
                return;
            }

            console.log("Fetching agenda from API...", { start: start.toISOString(), end: end.toISOString() });

            const res = await fetch(`/api/agenda?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            if (!res.ok) {
                const txt = await res.text().catch(() => null);
                console.error('[CalendarView] /api/agenda non-ok', res.status, txt);
                if (showSkeleton && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
                setLoading(false);
                return;
            }

            const json = await res.json().catch((err) => {
                console.error('[CalendarView] failed to parse JSON from /api/agenda', err);
                return null;
            });

            // Handle wrapped response { timestamp: ..., data: [...] } or raw array [...]
            const rawEvents = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : []);

            if (!Array.isArray(rawEvents)) {
                console.error('[CalendarView] unexpected /api/agenda payload, expected array or { data: [] }', json);
            }

            const mappedEvents: Event[] = rawEvents.map((e: any) => {
                // Normalize participants into string[]
                let participantsArr: string[] = [];
                if (e.participants) {
                    try {
                        if (Array.isArray(e.participants)) {
                            // flatten nested arrays and map objects to readable strings
                            const flat = e.participants.flat ? e.participants.flat() : e.participants;
                            participantsArr = flat
                                .map((p: any) => {
                                    if (!p) return '';
                                    if (typeof p === 'string') return p;
                                    if (typeof p === 'object') return p.name || p.email || JSON.stringify(p);
                                    return String(p);
                                })
                                .filter(Boolean);
                        } else if (typeof e.participants === 'object') {
                            participantsArr = [e.participants.name || e.participants.email].filter(Boolean);
                        }
                    } catch (err) {
                        console.error('Error parsing participants', err, e.participants);
                        participantsArr = [];
                    }
                }

                return {
                    id: e.id,
                    title: e.title,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    date: e.date,
                    participants: participantsArr,
                    meetingLink: e.meetingLink,
                    timezone: e.timezone || 'America/Bogota',
                } as Event;
            });

            // Debug: show what we received from the API and the normalized mapping
            console.debug('[CalendarView] API returned events count:', rawEvents.length);
            console.debug('[CalendarView] Mapped events sample:', mappedEvents.slice(0, 5));

            // Filter to only valid events (must include YYYY-MM-DD date)
            const validEvents = mappedEvents.filter((ev) => {
                if (!ev || !ev.date) {
                    console.warn('[CalendarView] dropping event without date', ev);
                    return false;
                }
                const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(String(ev.date));
                if (!isValidDate) {
                    console.warn('[CalendarView] event date not in YYYY-MM-DD format, dropping', ev.date, ev);
                    return false;
                }
                return true;
            });

            console.debug('[CalendarView] valid events to set:', validEvents.length);
            setEvents(validEvents);

            // Update Cache
            setCachedEvents(today.getFullYear(), today.getMonth(), validEvents);

            setLoading(false);

            if (showSkeleton && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
        } catch (error) {
            console.error("Auto-refresh failed", error);
            setLoading(false);
            if (showSkeleton) {
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
            }
        }
    };

    useEffect(() => {
        // Initial fetch showing skeleton overlay/events to ensures SkeletonManager clears
        fetchAgenda(true).then(() => {
            firstLoadRef.current = false;
        });
    }, []);

    // Trigger fetch and show skeleton only when user applies filters (refreshKey increments)
    useEffect(() => {
        // Skip the initial mount run
        if (firstLoadRef.current) return;
        fetchAgenda(true);
    }, [refreshKey]);

    // events are rendered inside each `CalendarDayColumn` (see `src/components/Agenda/Calendar/calendar-day-column.tsx`)
    // Each `CalendarDayColumn` renders one or more `EventCard` components for that day's events.
    // If you want to change how events are displayed, edit `EventCard` (title/avatar/time) or `CalendarDayColumn` (layout).
    const eventsByDay: Record<string, Event[]> = {};
    weekDays.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        eventsByDay[dayStr] = events.filter((e) => e.date === dayStr);
    });

    const isTodayInWeek = weekDays.some(
        (day) => format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );

    // Auto-scroll logic to center current time
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && scrollContainerRef.current) {
            const now = new Date();
            const top = getCurrentTimePosition(now);
            // Center the time or offset slightly so user sees context (300px buffer)
            const offset = Math.max(0, top - 300);
            scrollContainerRef.current.scrollTop = offset;
        }
    }, [loading]);

    const handleEventClick = (event: Event) => {
        setSelectedEvent(event);
        setSheetOpen(true);
    };

    const handlePrevWeek = () => {
        goToPreviousWeek();
        applyFilters({});
    };

    const handleNextWeek = () => {
        goToNextWeek();
        applyFilters({});
    };

    return (
        <>
            <EventSheet
                event={selectedEvent}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
            {/* Unified Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex flex-col flex-1 min-h-0 w-full overflow-auto relative"
                aria-busy={loading}
                role="status"
            >
                {loading && <span className="sr-only">Cargando eventos...</span>}

                {/* Sticky Header */}
                <CalendarWeekHeader
                    weekDays={weekDays}
                    onPreviousWeek={handlePrevWeek}
                    onNextWeek={handleNextWeek}
                />

                <div className="flex min-w-full w-max">
                    <CalendarHoursColumn />

                    {weekDays.map((day, dayIndex) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDay[dayStr] || [];

                        return (
                            <CalendarDayColumn
                                key={day.toISOString()}
                                day={day}
                                dayIndex={dayIndex}
                                events={dayEvents}
                                today={today}
                                isTodayInWeek={isTodayInWeek}
                                currentTime={currentTime}
                                onEventClick={handleEventClick}
                                loading={loading}
                            />
                        );
                    })}
                </div>
            </div>
        </>
    );
}