"use client";

import { format } from "date-fns";
import { useCalendarStore } from "../store/calendar-store";
import type { Event } from "../../../types/agenda";
import { useEffect, useRef, useState } from "react";
import { EventSheet } from "./event-sheet";
import { CalendarWeekHeader } from "./calendar-week-header";
import { CalendarHoursColumn } from "./calendar-hours-column";
import { CalendarDayColumn } from "./calendar-day-column";
import { getCurrentTimePosition } from "./calendar-utils";
import { useAgendaFetch } from "../hooks/useAgendaFetch";

export function CalendarView() {
    const { goToNextWeek, goToPreviousWeek, getWeekDays, getCurrentWeekEvents } =
        useCalendarStore();
    const { applyFilters } = useCalendarStore();
    const weekDays = getWeekDays();
    const events = getCurrentWeekEvents();
    const { loading } = useAgendaFetch();

    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const today = new Date();

    const eventsByDay: Record<string, Event[]> = {};
    weekDays.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        eventsByDay[dayStr] = events.filter((e) => e.date === dayStr);
    });

    const isTodayInWeek = weekDays.some(
        (day) => format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );

    // Auto-scroll to current time
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && scrollContainerRef.current) {
            const now = new Date();
            const top = getCurrentTimePosition(now);
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
            <div
                ref={scrollContainerRef}
                className="flex flex-col flex-1 min-h-0 w-full overflow-auto relative"
                aria-busy={loading}
                role="status"
            >
                {loading && <span className="sr-only">Cargando eventos...</span>}

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