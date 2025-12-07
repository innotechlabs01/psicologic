import type { APIRoute } from 'astro';
import { addSignalingMessage, getSignalingMessages } from '../../../lib/turso/agenda/agenda-db';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { meetingToken, type, payload, sender } = body;

        if (!meetingToken || !type || !payload || !sender) {
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
        }

        const success = await addSignalingMessage(meetingToken, type, payload, sender);

        if (success) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Failed to save signal' }), { status: 500 });
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ request, url }) => {
    const meetingToken = url.searchParams.get('token');
    const afterId = parseInt(url.searchParams.get('afterId') || '0');

    if (!meetingToken) {
        return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
    }

    const messages = await getSignalingMessages(meetingToken, afterId);
    return new Response(JSON.stringify(messages), { status: 200 });
};
