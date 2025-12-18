"use client";

import { HOURS_24, HOUR_HEIGHT } from "./calendar-utils";

export function CalendarHoursColumn() {
    return (
        <div
            className="w-[80px] md:w-[104px] border-r border-border shrink-0 relative"
        >
            {HOURS_24.map((hour) => (
                <div
                    key={hour}
                    className="border-b border-border p-2 md:p-3 text-xs md:text-sm text-muted-foreground"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                >
                    {hour}
                </div>
            ))}
        </div>
    );
}
