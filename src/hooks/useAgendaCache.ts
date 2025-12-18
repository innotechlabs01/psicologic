import { useState, useCallback } from 'react';

interface CacheEntry {
    timestamp: number;
    data: any[];
}

const CACHE_KEY_PREFIX = 'agenda_cache_';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useAgendaCache() {

    // Helper to generate a key for a specific month (e.g., '2023_10')
    const getCacheKey = (date: Date) => {
        return `${CACHE_KEY_PREFIX}${date.getFullYear()}_${date.getMonth()}`;
    };

    const getCachedEvents = useCallback((startDate: Date, endDate: Date) => {
        // We typically fetch 3 months at a time in CalendarView.
        // We will try to find cache for the "center" month (likely current or start).
        // For simplicity, we'll check the key for the startDate's month.
        // A more robust solution would check all involved months.

        const key = getCacheKey(startDate);
        // Note: Logic implies we cache based on the "main" month requested. 
        // If the view requests previous/next months too, we might need a more complex strategy, 
        // but let's stick to the dominant month for now or iterate.

        // Actually, let's verify if we have data for the *current* view.
        // If CalendarView requests -1 to +2 months, let's just use the current month as the primary key reference
        // or check multiple keys.

        // For this specific request "mostrar cache para esta semana":
        const now = new Date();
        const currentKey = getCacheKey(now);
        const cached = localStorage.getItem(currentKey);

        if (cached) {
            try {
                const entry: CacheEntry = JSON.parse(cached);
                const entryTime = entry.timestamp;

                // User wants to see cache for THIS week avoid DB query.
                // If the stored data covers the requested range, return it.
                // Here we simply return the data associated with the current month context.
                if (Date.now() - entryTime < CACHE_DURATION) {
                    console.log(`[AgendaCache] Hit for ${currentKey}`);
                    // Treat empty arrays as a cache miss so the UI will fetch fresh data
                    if (Array.isArray(entry.data) && entry.data.length === 0) {
                        console.log(`[AgendaCache] Ignoring empty cache for ${currentKey}`);
                    } else {
                        return entry.data;
                    }
                } else {
                    console.log(`[AgendaCache] Expired for ${currentKey}`);
                    // Don't auto-remove if we want to show stale data while fetching (swr-like), 
                    // but user requested to avoid DB if possible.
                    // We'll remove it to force refresh if expired.
                    localStorage.removeItem(currentKey);
                }
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(currentKey);
            }
        }
        return null;
    }, []);

    const setCachedEvents = useCallback((year: number, month: number, data: any[]) => {
        const date = new Date(year, month);
        const key = getCacheKey(date);

        const entry: CacheEntry = {
            timestamp: Date.now(),
            data
        };
        try {
            localStorage.setItem(key, JSON.stringify(entry));
            console.log(`[AgendaCache] Set for ${key} with ${data.length} items`);
        } catch (e) {
            console.error("Cache write error", e);
        }
    }, []);

    // 🆕 Add single event to cache (Optimistic Update)
    const addEventToCache = useCallback((newEvent: any) => {
        try {
            const date = new Date(newEvent.date); // Ensure event has a date field
            const key = getCacheKey(date);
            const cached = localStorage.getItem(key);

            if (cached) {
                const entry: CacheEntry = JSON.parse(cached);
                const updatedData = [...entry.data, newEvent];

                const newEntry: CacheEntry = {
                    timestamp: Date.now(), // Reset timestamp or keep original? Resetting keeps cache fresh.
                    data: updatedData
                };

                localStorage.setItem(key, JSON.stringify(newEntry));
                console.log(`[AgendaCache] Added event to cache ${key}`);
                return updatedData; // Return updated list for local state
            }
        } catch (e) {
            console.error("Error adding event to cache", e);
        }
        return null;
    }, []);

    const invalidateCache = useCallback(() => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        console.log("[AgendaCache] Invalidated all keys");
    }, []);

    return { getCachedEvents, setCachedEvents, addEventToCache, invalidateCache };
}
