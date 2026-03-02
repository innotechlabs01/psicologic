import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = locals.auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { mood, rating, comment } = body;

    if (!mood || !rating) {
      return new Response(JSON.stringify({ success: false, error: 'Mood and rating are required' }), { status: 400 });
    }

    const userResult = await db.execute({
      sql: "SELECT id FROM Usuarios WHERE clerk_user_id = ?",
      args: [userId]
    });

    let userIdInternal = null;
    if (userResult.rows.length > 0) {
      userIdInternal = userResult.rows[0].id;
    }

    await db.execute({
      sql: "INSERT INTO feedback (user_id, mood, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [userIdInternal, mood, rating, comment || '', new Date().toISOString()]
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { userId } = locals.auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    const userResult = await db.execute({
      sql: "SELECT role FROM Usuarios WHERE clerk_user_id = ?",
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'User not found' }), { status: 404 });
    }

    const userRole = String(userResult.rows[0][0]);
    const isAgent = userRole === 'agente_soporte' || userRole === 'org:admin';

    if (!isAgent) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403 });
    }

    const feedbackResult = await db.execute({
      sql: "SELECT f.*, u.username FROM feedback f LEFT JOIN Usuarios u ON f.user_id = u.id ORDER BY f.created_at DESC LIMIT 100",
      args: []
    });

    const feedback = feedbackResult.rows.map((row: any) => ({
      id: row[0],
      user_id: row[1],
      mood: row[2],
      rating: row[3],
      comment: row[4],
      created_at: row[5],
      username: row[6] || 'Anónimo'
    }));

    const statsResult = await db.execute({
      sql: "SELECT mood, COUNT(*) as count FROM feedback GROUP BY mood",
      args: []
    });

    const moodStats = statsResult.rows.map((row: any) => ({
      mood: row[0],
      count: Number(row[1])
    }));

    const avgResult = await db.execute({
      sql: "SELECT AVG(rating) as avg FROM feedback",
      args: []
    });

    const avgRating = avgResult.rows[0]?.[0] ? Number(avgResult.rows[0][0]).toFixed(1) : 0;

    return new Response(JSON.stringify({ 
      success: true, 
      feedback,
      stats: moodStats,
      avgRating
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};
