"use client";

import { format } from "date-fns";
import { useCalendarStore } from "../store/calendar-store";
import type { Event } from "../mock-data/events";
import { useEffect, useRef, useState } from "react";
import { EventSheet } from "./event-sheet";
import { CalendarWeekHeader } from "./calendar-week-header";
import { CalendarHoursColumn } from "./calendar-hours-column";
import { CalendarDayColumn } from "./calendar-day-column";
import { INITIAL_SCROLL_OFFSET } from "./calendar-utils";

export function CalendarView() {
    const { goToNextWeek, goToPreviousWeek, getWeekDays, getCurrentWeekEvents, setEvents } =
        useCalendarStore();
    const weekDays = getWeekDays();
    const events = getCurrentWeekEvents();
    const hoursScrollRef = useRef<HTMLDivElement>(null);
    const daysScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
    const hasScrolledRef = useRef(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const today = new Date();

    useEffect(() => {
        const refreshData = async () => {
            try {
                // Trigger global skeleton by making a request
                await fetch('/api/headers/api');

                // Fetch real events
                const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

                const res = await fetch(`/api/agenda?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
                if (res.ok) {
                    const data = await res.json();
                    // Map API AgendaEvent to UI Event interface
                    const mappedEvents: Event[] = data.map((e: any) => ({
                        id: e.id,
                        title: e.title,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        date: e.date,
                        participants: e.participants ? [`Name: ${e.participants.name}`, `Email: ${e.participants.email}`] : [],
                        meetingLink: e.meetingLink,
                        timezone: 'America/Bogota'
                    }));
                    setEvents(mappedEvents);
                }
            } catch (error) {
                console.error("Auto-refresh failed", error);
            }
        };

        refreshData(); // Initial Load

        const interval = setInterval(() => {
            setCurrentTime(new Date());
            refreshData();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const eventsByDay: Record<string, Event[]> = {};
    weekDays.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        eventsByDay[dayStr] = events.filter((e) => e.date === dayStr);
    });

    const isTodayInWeek = weekDays.some(
        (day) => format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );

    useEffect(() => {
        const scrollToInitial = () => {
            if (!hasScrolledRef.current && hoursScrollRef.current) {
                hoursScrollRef.current.scrollTop = INITIAL_SCROLL_OFFSET;
                daysScrollRefs.current.forEach((ref) => {
                    if (ref) {
                        ref.scrollTop = INITIAL_SCROLL_OFFSET;
                    }
                });
                hasScrolledRef.current = true;
            }
        };

        scrollToInitial();
        const timeoutId = setTimeout(scrollToInitial, 100);
        return () => clearTimeout(timeoutId);
    }, [weekDays]);

    const handleHoursScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        daysScrollRefs.current.forEach((ref) => {
            if (ref) {
                ref.scrollTop = scrollTop;
            }
        });
    };

    const handleDayScroll =
        (index: number) => (e: React.UIEvent<HTMLDivElement>) => {
            const scrollTop = e.currentTarget.scrollTop;
            if (hoursScrollRef.current) {
                hoursScrollRef.current.scrollTop = scrollTop;
            }
            daysScrollRefs.current.forEach((ref, idx) => {
                if (ref && idx !== index) {
                    ref.scrollTop = scrollTop;
                }
            });
        };

    const handleEventClick = (event: Event) => {
        setSelectedEvent(event);
        setSheetOpen(true);
    };

    return (
        <>
            <EventSheet
                event={selectedEvent}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
            <div className="flex flex-col h-full overflow-x-auto w-full">
                <CalendarWeekHeader
                    weekDays={weekDays}
                    onPreviousWeek={goToPreviousWeek}
                    onNextWeek={goToNextWeek}
                />

                <div className="flex min-w-full w-max">
                    <CalendarHoursColumn
                        onScroll={handleHoursScroll}
                        scrollRef={hoursScrollRef}
                    />

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
                                onScroll={handleDayScroll}
                                scrollRef={(el) => {
                                    daysScrollRefs.current[dayIndex] = el;
                                }}
                                onEventClick={handleEventClick}
                            />
                        );
                    })}
                </div>
            </div>
        </>
    );
}