"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCalendarStore } from "../store/calendar-store";
import { useAgendaCache } from "../../../hooks/useAgendaCache";
import { normalizeParticipants } from "../../../utils/participants";
import type { Event } from "../../../types/agenda";

interface UseAgendaFetchReturn {
    loading: boolean;
    refetch: (showSkeleton?: boolean) => Promise<void>;
}

export function useAgendaFetch(): UseAgendaFetchReturn {
    const { setEvents } = useCalendarStore();
    const { refreshKey } = useCalendarStore();
    const { getCachedEvents, setCachedEvents } = useAgendaCache();
    const [loading, setLoading] = useState(true);
    const firstLoadRef = useRef(true);
    const today = new Date();

    const fetchAgenda = useCallback(async (showSkeleton = false) => {
        try {
            if (showSkeleton) {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('agenda:fetch-start'));
                }
                setLoading(true);
            }

            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

            const cachedData = getCachedEvents(today, end);
            if (cachedData) {
                setEvents(cachedData);
                if (showSkeleton) {
                    setLoading(false);
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
                    }
                }
                return;
            }

            const res = await fetch(
                `/api/agenda?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
            );

            if (!res.ok) {
                if (showSkeleton && typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
                }
                setLoading(false);
                return;
            }

            const json = await res.json().catch(() => null);
            const rawEvents = Array.isArray(json)
                ? json
                : json && Array.isArray(json.data)
                    ? json.data
                    : [];

            const mappedEvents: Event[] = rawEvents.map((e: any) => ({
                id: e.id,
                title: e.title,
                startTime: e.startTime,
                endTime: e.endTime,
                date: e.date,
                participants: normalizeParticipants(e.participants),
                meetingLink: e.meetingLink,
                timezone: e.timezone || 'America/Bogota',
            }));

            const validEvents = mappedEvents.filter((ev) => {
                if (!ev || !ev.date) return false;
                return /^\d{4}-\d{2}-\d{2}$/.test(String(ev.date));
            });

            setEvents(validEvents);
            setCachedEvents(today.getFullYear(), today.getMonth(), validEvents);
            setLoading(false);

            if (showSkeleton && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
            }
        } catch {
            setLoading(false);
            if (showSkeleton && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('agenda:fetch-end'));
            }
        }
    }, [getCachedEvents, setCachedEvents, setEvents]);

    // Initial fetch
    useEffect(() => {
        fetchAgenda(true).then(() => {
            firstLoadRef.current = false;
        });
    }, []);

    // Re-fetch when filters applied (refreshKey increments)
    useEffect(() => {
        if (firstLoadRef.current) return;
        fetchAgenda(true);
    }, [refreshKey]);

    return { loading, refetch: fetchAgenda };
}
