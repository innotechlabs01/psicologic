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

    const getCachedEvents = useCallback((year: number, month: number) => {
        const date = new Date(year, month);
        const currentKey = getCacheKey(date);
        const cached = localStorage.getItem(currentKey);

        if (cached) {
            try {
                const entry: CacheEntry = JSON.parse(cached);
                const entryTime = entry.timestamp;

                if (Date.now() - entryTime < CACHE_DURATION) {
                    console.log(`[AgendaCache] Hit for ${currentKey}`);
                    if (Array.isArray(entry.data) && entry.data.length === 0) {
                        console.log(`[AgendaCache] Ignoring empty cache for ${currentKey}`);
                    } else {
                        return entry.data;
                    }
                } else {
                    console.log(`[AgendaCache] Expired for ${currentKey}`);
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
