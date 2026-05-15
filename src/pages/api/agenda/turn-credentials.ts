import type { APIRoute } from "astro";

const FALLBACK_ICE: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export const GET: APIRoute = async () => {
    const keyId = import.meta.env.CLOUDFLARE_TURN_KEY_ID;
    const apiToken = import.meta.env.CLOUDFLARE_TURN_API_TOKEN;

    if (!keyId || !apiToken) {
        return new Response(JSON.stringify({ iceServers: FALLBACK_ICE }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const res = await fetch(
            `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ttl: 86400 }),
            }
        );

        if (!res.ok) {
            console.error(`[TURN] Cloudflare API error: ${res.status}`);
            return new Response(JSON.stringify({ iceServers: FALLBACK_ICE }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        const data = await res.json();

        const iceServers: RTCIceServer[] = [
            { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
            ...(data.iceServers || []),
        ];

        return new Response(JSON.stringify({ iceServers }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        console.error("[TURN] Error:", e);
        return new Response(JSON.stringify({ iceServers: FALLBACK_ICE }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
};
