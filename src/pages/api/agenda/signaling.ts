import type { APIRoute } from 'astro';
import { addSignalingMessage, getSignalingMessages, clearSignalingRoom } from '../../../lib/turso/agenda/agenda-db';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { meetingToken, type, payload, sender } = body;

        console.log(`[Signaling POST] Receving: ${type} from ${sender} for ${meetingToken}`);

        if (!meetingToken || !type || !payload || !sender) {
            console.error("[Signaling POST] Missing required fields", { meetingToken, type, sender });
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
        }

        const success = await addSignalingMessage(meetingToken, type, payload, sender);

        if (success) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            console.error("[Signaling POST] Database operation failed");
            return new Response(JSON.stringify({ error: 'Failed to save signal' }), { status: 500 });
        }

    } catch (error) {
        console.error("[Signaling POST] Internal Exception:", error);
        return new Response(JSON.stringify({ error: 'Internal Error', details: error instanceof Error ? error.message : String(error) }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ request, url }) => {
    try {
        const meetingToken = url.searchParams.get('token');
        const afterIdStr = url.searchParams.get('afterId');
        const afterId = parseInt(afterIdStr || '0');

        if (!meetingToken) {
            return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
        }

        const messages = await getSignalingMessages(meetingToken, afterId);
        return new Response(JSON.stringify(messages), { status: 200 });
    } catch (error) {
        console.error("[Signaling GET] Internal Exception:", error);
        return new Response(JSON.stringify({ error: 'Internal Error', details: error instanceof Error ? error.message : String(error) }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { meetingToken } = body;

        if (!meetingToken) {
            return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
        }

        const success = await clearSignalingRoom(meetingToken);
        if (success) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Failed to clear room' }), { status: 500 });
        }
    } catch (error) {
        console.error("[Signaling DELETE] Internal Exception:", error);
        return new Response(JSON.stringify({ error: 'Internal Error', details: error instanceof Error ? error.message : String(error) }), { status: 500 });
    }
};
