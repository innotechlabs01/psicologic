import { db } from '../turso/client';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface Ticket {
  ticket_id: string;
  user_id: string;
  cliente_id: string | null;
  asunto: string;
  estado: string;
  fecha_creacion: number;
}

export interface Message {
  message_id: string;
  ticket_id: string;
  sender_id: string;
  contenido: string;
  tipo: string;
  url_adjunto: string | null;
  fecha_envio: number;
}

export async function createTicket(userId: string, clerkUserId: string): Promise<{ ticketId: string; exists: boolean }> {
  const userResult = await db.execute({
    sql: "SELECT id, role FROM Usuarios WHERE clerk_user_id = ?",
    args: [clerkUserId]
  });

  if (!userResult.rows.length) {
    throw new Error('Usuario no encontrado');
  }

  const internalUserId = userResult.rows[0].id;

  const openTicket = await db.execute({
    sql: "SELECT ticket_id FROM Tickets WHERE user_id = ? AND estado = 'Abierto'",
    args: [internalUserId]
  });

  if (openTicket.rows.length > 0) {
    return { ticketId: String(openTicket.rows[0][0]), exists: true };
  }

  const ticketId = generateUUID();
  await db.execute({
    sql: "INSERT INTO Tickets (ticket_id, user_id, asunto, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?)",
    args: [ticketId, internalUserId, 'Nuevo chat de soporte', 'Abierto', Date.now()]
  });

  return { ticketId, exists: false };
}

export async function getUserTickets(clerkUserId: string): Promise<Ticket[]> {
  const userResult = await db.execute({
    sql: "SELECT id FROM Usuarios WHERE clerk_user_id = ?",
    args: [clerkUserId]
  });

  if (!userResult.rows.length) return [];

  const internalUserId = userResult.rows[0].id;

  const ticketsResult = await db.execute({
    sql: "SELECT ticket_id, user_id, cliente_id, asunto, estado, fecha_creacion FROM Tickets WHERE user_id = ? ORDER BY fecha_creacion DESC",
    args: [internalUserId]
  });

  return ticketsResult.rows.map((row: any) => ({
    ticket_id: String(row[0]),
    user_id: String(row[1]),
    cliente_id: row[2] ? String(row[2]) : null,
    asunto: String(row[3]),
    estado: String(row[4]),
    fecha_creacion: Number(row[5])
  }));
}

export async function getActiveTickets(): Promise<{ ticket_id: string; user_name: string; last_message: string; fecha: number }[]> {
  const ticketsResult = await db.execute({
    sql: `
      SELECT 
        T.ticket_id, 
        T.fecha_creacion,
        U.username,
        (SELECT contenido FROM Messages WHERE ticket_id = T.ticket_id ORDER BY fecha_envio DESC LIMIT 1) as last_message
      FROM Tickets T 
      JOIN Usuarios U ON T.user_id = U.id 
      WHERE T.estado = 'Abierto' 
      ORDER BY T.fecha_creacion DESC
    `,
    args: []
  });

  return ticketsResult.rows.map((row: any) => ({
    ticket_id: String(row[0]),
    fecha: Number(row[1]),
    user_name: String(row[2]),
    last_message: row[3] ? String(row[3]) : 'Nuevo chat'
  }));
}

export async function getTicketMessages(ticketId: string, clerkUserId: string): Promise<{ messages: Message[]; isClosed: boolean; userName?: string }> {
  const userResult = await db.execute({
    sql: "SELECT id, role, username FROM Usuarios WHERE clerk_user_id = ?",
    args: [clerkUserId]
  });

  if (!userResult.rows.length) {
    throw new Error('Usuario no encontrado');
  }

  const userRecord = userResult.rows[0];
  const currentUserId = String(userRecord[0]);
  const currentRole = String(userRecord[1]);
  const isAgent = currentRole === 'agente_soporte' || currentRole === 'org:admin';

  const ticketResult = await db.execute({
    sql: "SELECT user_id, estado FROM Tickets WHERE ticket_id = ?",
    args: [ticketId]
  });

  if (!ticketResult.rows.length) {
    throw new Error('Ticket no encontrado');
  }

  const isClientOwner = String(ticketResult.rows[0][0]) === currentUserId;
  if (!isClientOwner && !isAgent) {
    throw new Error('No autorizado');
  }

  const messagesResult = await db.execute({
    sql: "SELECT message_id, ticket_id, sender_id, contenido, tipo, url_adjunto, fecha_envio FROM Messages WHERE ticket_id = ? ORDER BY fecha_envio ASC",
    args: [ticketId]
  });

  const messages: Message[] = messagesResult.rows.map((row: any) => ({
    message_id: String(row[0]),
    ticket_id: String(row[1]),
    sender_id: String(row[2]),
    contenido: String(row[3]),
    tipo: String(row[4]),
    url_adjunto: row[5] ? String(row[5]) : null,
    fecha_envio: Number(row[6])
  }));

  const isClosed = ticketResult.rows[0][1] !== 'Abierto';

  let userName: string | undefined;
  if (isAgent) {
    userName = String(userRecord[2]);
  }

  return { messages, isClosed, userName };
}

export async function sendMessage(ticketId: string, senderId: string, content: string, type: string = 'texto', urlAdjunto: string | null = null): Promise<string> {
  const messageId = generateUUID();
  
  await db.execute({
    sql: "INSERT INTO Messages (message_id, ticket_id, sender_id, contenido, tipo, url_adjunto, fecha_envio) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [messageId, ticketId, senderId, content, type, urlAdjunto, Date.now()]
  });

  return messageId;
}

export async function closeTicket(ticketId: string): Promise<void> {
  await db.execute({
    sql: "UPDATE Tickets SET estado = 'Cerrado' WHERE ticket_id = ?",
    args: [ticketId]
  });
}

export async function getUserByClerkId(clerkUserId: string): Promise<{ id: string; role: string; username: string } | null> {
  const result = await db.execute({
    sql: "SELECT id, role, username FROM Usuarios WHERE clerk_user_id = ?",
    args: [clerkUserId]
  });

  if (!result.rows.length) return null;

  const row = result.rows[0];
  return {
    id: String(row[0]),
    role: String(row[1]),
    username: String(row[2])
  };
}
