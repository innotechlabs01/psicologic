// Re-export Event type from central types for backward compatibility
export type { Event } from "../../../types/agenda";

// Legacy mock data — kept for backward compatibility but data now comes from API
import type { Event } from "../../../types/agenda";

export const events: Event[] = [];

export function addEvent(event: Omit<Event, "id"> | any): void {
    // No-op: events are managed through the API and store
}
