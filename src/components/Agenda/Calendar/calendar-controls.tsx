"use client";

import { useState } from "react";
import {
    Search,
    Settings,
    Calendar as CalendarIcon,
    SlidersHorizontal,
    Check,
    Video,
    VideoOff,
    Users,
    UserX,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useCalendarStore } from "../store/calendar-store";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { Separator } from "../ui/separator";
import { cn } from "../../../lib/utils";

export function CalendarControls() {
    const {
        searchQuery,
        setSearchQuery,
        goToToday,
        goToDate,
        currentWeekStart,
        eventTypeFilter,
        participantsFilter,
        setEventTypeFilter,
        setParticipantsFilter,
        applyFilters,
    } = useCalendarStore();
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [localEventType, setLocalEventType] = useState<typeof eventTypeFilter>(eventTypeFilter);
    const [localParticipants, setLocalParticipants] = useState<typeof participantsFilter>(participantsFilter);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const weekStart = format(currentWeekStart, "MMM dd");
    const weekEnd = format(
        new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        "MMM dd yyyy"
    );

    const hasActiveFilters =
        eventTypeFilter !== "all" || participantsFilter !== "all";

    return (
        <div className="px-3 md:px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-[280px] shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search in calendar..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                applyFilters({ searchQuery: localSearch, eventTypeFilter: localEventType, participantsFilter: localParticipants });
                            }
                        }}
                        className="pl-9 pr-9 h-8 bg-background"
                    />
                    <Button variant="ghost" size="icon" className="absolute right-8 top-1/2 -translate-y-1/2 size-6" onClick={() => applyFilters({ searchQuery: localSearch, eventTypeFilter: localEventType, participantsFilter: localParticipants })}>
                        <Search className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 size-6"
                    >
                        <Settings className="size-3.5" />
                    </Button>
                </div>

                <Button
                    variant="outline"
                    className="h-8 px-3 shrink-0"
                    onClick={goToToday}
                >
                    Today
                </Button>

                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "h-8 px-3 gap-2 justify-start text-left font-normal shrink-0",
                                "hover:bg-accent"
                            )}
                        >
                            <CalendarIcon className="size-4 text-muted-foreground" />
                            <span className="text-xs text-foreground">
                                {weekStart} - {weekEnd}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={currentWeekStart}
                            onSelect={(date) => {
                                if (date) {
                                    goToDate(date);
                                    applyFilters({});
                                    setDatePickerOpen(false);
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <div className="ml-auto" />

                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn("h-8 px-3 gap-2", hasActiveFilters && "bg-accent")}
                        >
                            <SlidersHorizontal className="size-4" />
                            <span className="hidden sm:inline text-xs">Filter</span>
                            {hasActiveFilters && (
                                <span className="size-1.5 rounded-full bg-primary" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                        <div className="flex items-center gap-2 mb-3">
                            <Button
                                variant="outline"
                                className="h-8 px-3 shrink-0"
                                onClick={() => {
                                    goToToday();
                                    applyFilters({});
                                    setFilterOpen(false);
                                }}
                            >
                                Today
                            </Button>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Video className="size-4 text-muted-foreground" />
                                Event Type
                            </h4>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-9 px-3"
                                    onClick={() => setLocalEventType("all")}
                                >
                                    <span className="text-sm">All events</span>
                                    {localEventType === "all" && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-9 px-3"
                                    onClick={() => setLocalEventType("with-meeting")}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Video className="size-4 text-cyan-500" />
                                        <span className="text-sm">With meeting</span>
                                    </div>
                                    {localEventType === "with-meeting" && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-9 px-3"
                                    onClick={() => setLocalEventType("without-meeting")}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <VideoOff className="size-4 text-muted-foreground" />
                                        <span className="text-sm">Without meeting</span>
                                    </div>
                                    {localEventType === "without-meeting" && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-3" />

                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Users className="size-4 text-muted-foreground" />
                                Participants
                            </h4>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-9 px-3"
                                    onClick={() => setLocalParticipants("all")}
                                >
                                    <span className="text-sm">All</span>
                                    {localParticipants === "all" && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-9 px-3"
                                    onClick={() => setLocalParticipants("with-participants")}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Users className="size-4 text-muted-foreground" />
                                        <span className="text-sm">With participants</span>
                                    </div>
                                    {localParticipants === "with-participants" && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-9 px-3"
                                    onClick={() =>
                                        setLocalParticipants("without-participants")
                                    }
                                >
                                    <div className="flex items-center gap-2.5">
                                        <UserX className="size-4 text-muted-foreground" />
                                        <span className="text-sm">Without participants</span>
                                    </div>
                                    {localParticipants === "without-participants" && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-3" />
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => {
                                setLocalEventType("all");
                                setLocalParticipants("all");
                                setLocalSearch('');
                            }}>
                                Reset
                            </Button>
                            <Button variant="primary" size="sm" className="flex-1 h-9" onClick={() => {
                                applyFilters({ searchQuery: localSearch, eventTypeFilter: localEventType, participantsFilter: localParticipants });
                                setFilterOpen(false);
                            }}>
                                Apply Filters
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
