import { create } from "zustand";
import {
    format,
    startOfWeek,
    addWeeks,
    subWeeks,
    addDays,
    getDay,
} from "date-fns";
import { type Event, events, addEvent as addEventToStore } from "../mock-data/events";

interface CalendarState {
    events: Event[];
    setEvents: (events: Event[]) => void;
    currentWeekStart: Date;
    searchQuery: string;
    eventTypeFilter: "all" | "with-meeting" | "without-meeting";
    participantsFilter: "all" | "with-participants" | "without-participants";
    goToNextWeek: () => void;
    goToPreviousWeek: () => void;
    goToToday: () => void;
    goToDate: (date: Date) => void;
    setSearchQuery: (query: string) => void;
    setEventTypeFilter: (
        filter: "all" | "with-meeting" | "without-meeting"
    ) => void;
    setParticipantsFilter: (
        filter: "all" | "with-participants" | "without-participants"
    ) => void;
    addEvent: (event: Omit<Event, "id">) => void;
    getCurrentWeekEvents: () => Event[];
    getWeekDays: () => Date[];
}

const BASE_WEEK_START = new Date("2024-02-04");

function getDayOfWeek(date: Date): number {
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
}

function getEventsForWeek(startDate: Date, allEvents: Event[]): Event[] {
    const weekEvents: Event[] = [];

    for (let i = 0; i < 7; i++) {
        const currentDay = addDays(startDate, i);
        const currentDayOfWeek = getDayOfWeek(currentDay);

        allEvents.forEach((event) => {
            const eventDate = new Date(event.date);
            const eventDayOfWeek = getDayOfWeek(eventDate);

            if (eventDayOfWeek === currentDayOfWeek) {
                // Ensure we compare actual dates, not just day of week if year differs
                // But keeping original logic structure for consistency, just using state events
                if (event.date === format(currentDay, 'yyyy-MM-dd')) {
                    weekEvents.push(event);
                }
            }
        });
    }

    return weekEvents;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    events: [], // Start empty, load from API
    setEvents: (events) => set({ events }),

    currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
    searchQuery: "",
    eventTypeFilter: "all",
    participantsFilter: "all",

    goToNextWeek: () =>
        set((state) => ({
            currentWeekStart: addWeeks(state.currentWeekStart, 1),
        })),

    goToPreviousWeek: () =>
        set((state) => ({
            currentWeekStart: subWeeks(state.currentWeekStart, 1),
        })),

    goToToday: () =>
        set({
            currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
        }),

    goToDate: (date: Date) =>
        set({
            currentWeekStart: startOfWeek(date, { weekStartsOn: 1 }),
        }),

    setSearchQuery: (query: string) => set({ searchQuery: query }),
    setEventTypeFilter: (filter: "all" | "with-meeting" | "without-meeting") =>
        set({ eventTypeFilter: filter }),
    setParticipantsFilter: (
        filter: "all" | "with-participants" | "without-participants"
    ) => set({ participantsFilter: filter }),

    addEvent: (event: Omit<Event, "id">) => {
        // Optimistic update
        set((state) => ({
            events: [...state.events, { ...event, id: Math.random().toString() }]
        }));
    },

    getCurrentWeekEvents: () => {
        const state = get();
        // Use state.events instead of imported 'events'
        let weekEvents = getEventsForWeek(state.currentWeekStart, state.events);

        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            weekEvents = weekEvents.filter(
                (event) =>
                    event.title.toLowerCase().includes(query) ||
                    event.participants.some((p) => p.toLowerCase().includes(query))
            );
        }

        if (state.eventTypeFilter === "with-meeting") {
            weekEvents = weekEvents.filter((event) => event.meetingLink);
        } else if (state.eventTypeFilter === "without-meeting") {
            weekEvents = weekEvents.filter((event) => !event.meetingLink);
        }

        if (state.participantsFilter === "with-participants") {
            weekEvents = weekEvents.filter((event) => event.participants.length > 0);
        } else if (state.participantsFilter === "without-participants") {
            weekEvents = weekEvents.filter(
                (event) => event.participants.length === 0
            );
        }

        return weekEvents;
    },

    getWeekDays: () => {
        const state = get();
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(state.currentWeekStart, i));
        }
        return days;
    },
}));
