import React, { useState, useEffect, useCallback } from 'react';

interface Ticket {
  ticket_id: string;
  user_name: string;
  last_message: string;
  fecha: number;
}

interface AdminChatProps {
  currentUserId: string;
  currentUserRole: string;
  initialTickets?: Ticket[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-CO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminChatDashboard({ currentUserId, currentUserRole, initialTickets = [] }: AdminChatProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets/admin/list');
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setIsClosed(data.isClosed);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket);
      const interval = setInterval(() => fetchMessages(selectedTicket), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket, fetchMessages]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket.ticket_id);
    setSelectedUserName(ticket.user_name);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || isClosed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(selectedTicket);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket || !confirm('¿Cerrar este ticket?')) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket}/close`, { method: 'POST' });
      if (res.ok) {
        setIsClosed(true);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }
  };

  return (
    <div className="flex h-[75vh] bg-card rounded-xl overflow-hidden border border-border">
      {/* Ticket List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Conversaciones</h3>
          <p className="text-sm text-muted-foreground">{tickets.length} abiertas</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No hay conversaciones
            </div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.ticket_id}
                onClick={() => handleSelectTicket(ticket)}
                className={`w-full p-4 text-left border-b border-border hover:bg-muted transition-colors ${
                  selectedTicket === ticket.ticket_id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {ticket.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{ticket.user_name}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(ticket.fecha)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{ticket.last_message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedTicket ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Selecciona una conversación</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Chat con: {selectedUserName}</h3>
                <p className="text-xs text-muted-foreground">Ticket: {selectedTicket.slice(0, 8)}...</p>
              </div>
              {!isClosed && (
                <button
                  onClick={handleCloseTicket}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Cerrar Ticket
                </button>
              )}
              {isClosed && (
                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                  Cerrado
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No hay mensajes
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-muted text-foreground rounded-bl-none'
                      }`}>
                        {!isOwn && <p className="text-xs font-medium mb-1">{selectedUserName}</p>}
                        <p className="text-sm">{msg.contenido}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.fecha_envio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              {isClosed ? (
                <div className="text-center text-muted-foreground py-2">
                  Esta conversación ha sido cerrada
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? '...' : 'Enviar'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
