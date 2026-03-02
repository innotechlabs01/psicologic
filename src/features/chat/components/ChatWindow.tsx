import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  message_id: string;
  sender_id: string;
  contenido: string;
  tipo: string;
  url_adjunto: string | null;
  fecha_envio: number;
}

interface ChatWindowProps {
  ticketId: string;
  currentUserId: string;
  currentUserRole: string;
  userName?: string;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function ChatWindow({ ticketId, currentUserId, currentUserRole }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isAgent = currentUserRole === 'agente_soporte' || currentUserRole === 'org:admin';

  const fetchMessages = useCallback(async () => {
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
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || isClosed) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('¿Estás seguro de cerrar esta conversación?')) return;
    
    try {
      const res = await fetch(`/api/tickets/${ticketId}/close`, { method: 'POST' });
      if (res.ok) {
        setIsClosed(true);
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h3 className="font-semibold">Conversación de Soporte</h3>
          <p className="text-xs text-muted-foreground">Ticket: {ticketId.slice(0, 8)}...</p>
        </div>
        {isAgent && !isClosed && (
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Cerrar Ticket
          </button>
        )}
        {isClosed && (
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
            Conversation closed
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No hay mensajes aún</p>
            <p className="text-sm">Inicia la conversación</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div key={msg.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  isOwn 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}>
                  <p className="text-sm">{msg.contenido}</p>
                  {msg.tipo === 'imagen' && msg.url_adjunto && (
                    <a href={msg.url_adjunto} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img src={msg.url_adjunto} alt="Image" className="max-h-40 rounded-lg" />
                    </a>
                  )}
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatTime(msg.fecha_envio)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/30">
        {isClosed ? (
          <div className="text-center text-muted-foreground py-2">
            Esta conversación ha sido cerrada
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSending ? '...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
