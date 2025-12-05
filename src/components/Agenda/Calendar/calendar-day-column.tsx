"use client";

import type { Event } from "../mock-data/events";
import {
    HOURS_24,
    HOUR_HEIGHT,
    getEventTop,
    getEventHeight,
    getHoliday,
} from "./calendar-utils";
import { EventCard } from "./event-card";
import { CurrentTimeIndicator } from "./current-time-indicator";
import { cn } from "../../../lib/utils";

interface CalendarDayColumnProps {
    day: Date;
    dayIndex: number;
    events: Event[];
    today: Date;
    isTodayInWeek: boolean;
    currentTime: Date;
    onScroll: (index: number) => (e: React.UIEvent<HTMLDivElement>) => void;
    scrollRef: (el: HTMLDivElement | null) => void;
    onEventClick: (event: Event) => void;
}

export function CalendarDayColumn({
    day,
    dayIndex,
    events,
    today,
    isTodayInWeek,
    currentTime,
    onScroll,
    scrollRef,
    onEventClick,
}: CalendarDayColumnProps) {
    const holiday = getHoliday(day);

    return (
        <div
            ref={scrollRef}
            onScroll={onScroll(dayIndex)}
            className={cn(
                "flex-1 border-r border-border last:border-r-0 relative min-w-44 overflow-y-auto transition-shadow duration-300",
                holiday &&
                "bg-red-100/50 dark:bg-red-900/20 shadow-[0_0_12px_rgba(255,0,0,0.45)]"
            )}
        >
            {/* Banda fija arriba con el nombre del festivo */}
            {holiday && (
                <div className="sticky top-0 left-0 right-0 z-10 bg-red-500 text-white text-xs font-medium py-1 px-2 text-center shadow-sm">
                    {holiday}
                </div>
            )}

            {/* Líneas horarias */}
            {HOURS_24.map((hour) => (
                <div
                    key={hour}
                    className="border-b border-border"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                />
            ))}

            {/* Indicador de hora actual */}
            <CurrentTimeIndicator
                day={day}
                today={today}
                isTodayInWeek={isTodayInWeek}
                currentTime={currentTime}
            />

            {/* Eventos */}
            {events.map((event) => {
                const top = getEventTop(event.startTime);
                const height = getEventHeight(event.startTime, event.endTime);

                return (
                    <EventCard
                        key={event.id}
                        event={event}
                        style={{
                            top: `${top + 4}px`,
                            height: `${height - 8}px`,
                        }}
                        onClick={() => onEventClick(event)}
                    />
                );
            })}
        </div>
    );
}
