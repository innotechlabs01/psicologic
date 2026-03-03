/**
 * Normalize participants from various formats (string, object, nested array)
 * into a flat array of display-friendly strings.
 */
export function normalizeParticipants(input: unknown): string[] {
    if (!input) return [];

    if (Array.isArray(input)) {
        try {
            const flat = (input as any[]).flat ? (input as any[]).flat() : (input as any[]);
            return flat
                .map((p: any) => {
                    if (!p) return '';
                    if (typeof p === 'string') return p;
                    if (Array.isArray(p)) return p.join(', ');
                    if (typeof p === 'object') return p.name || p.email || JSON.stringify(p);
                    return String(p);
                })
                .map((s: string) => s.trim())
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    if (typeof input === 'object' && input !== null) {
        const name = (input as any).name;
        const email = (input as any).email;
        return [name || email].filter(Boolean);
    }

    return [String(input)].filter(Boolean);
}
