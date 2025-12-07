import { useState, useCallback } from 'react';

interface CacheEntry {
    timestamp: number;
    data: any[];
}

const CACHE_KEY_PREFIX = 'agenda_cache_';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function useAgendaCache() {

    const getCachedEvents = useCallback((year: number, month: number) => {
        const key = `${CACHE_KEY_PREFIX}${year}_${month}`;
        const cached = localStorage.getItem(key);

        if (cached) {
            try {
                const entry: CacheEntry = JSON.parse(cached);
                const now = Date.now();
                if (now - entry.timestamp < CACHE_DURATION) {
                    console.log(`[AgendaCache] Hit for ${key}`);
                    return entry.data;
                } else {
                    console.log(`[AgendaCache] Expired for ${key}`);
                    localStorage.removeItem(key);
                }
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(key);
            }
        }
        return null;
    }, []);

    const setCachedEvents = useCallback((year: number, month: number, data: any[]) => {
        const key = `${CACHE_KEY_PREFIX}${year}_${month}`;
        const entry: CacheEntry = {
            timestamp: Date.now(),
            data
        };
        try {
            localStorage.setItem(key, JSON.stringify(entry));
            console.log(`[AgendaCache] Set for ${key}`);
        } catch (e) {
            console.error("Cache write error (Quota?)", e);
        }
    }, []);

    const invalidateCache = useCallback(() => {
        // Clear all agenda related keys
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        console.log("[AgendaCache] Invalidated all keys");
    }, []);

    return { getCachedEvents, setCachedEvents, invalidateCache };
}
