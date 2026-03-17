import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
    Send, 
    MessageSquare, 
    XCircle, 
    Clock, 
    User, 
    CheckCheck, 
    MoreVertical, 
    Smile, 
    Paperclip,
    ArrowLeft
} from 'lucide-react';

const AGENT_ROLE = 'agente_soporte';

const INITIAL_STATE = {
    ticketId: null,
    userName: null,
    messages: [],
    isClosed: false,
    error: null,
    pollingInterval: 5000, 
};

/**
 * Respuestas rápidas predefinidas para optimizar el trabajo del agente.
 */
const QUICK_REPLIES = [
    "Hola, ¿en qué puedo ayudarte hoy?",
    "Entiendo perfectamente su consulta. Déjeme verificarlo.",
    "¿Podría proporcionarme más detalles sobre esto?",
    "Gracias por esperar. Ya tengo la solución.",
    "Su ticket ha sido resuelto. ¿Desea algo más?",
];

export default function ChatInterfaceAdmin({ currentUserId, currentUserRole }) {
    const [chatState, setChatState] = useState(INITIAL_STATE);
    const [newMessage, setNewMessage] = useState('');
    const [isInitialLoad, setIsInitialLoad] = useState(false); 
    const chatEndRef = useRef(null);
    const intervalRef = useRef(null);
    
    const isAgentUser = currentUserRole === AGENT_ROLE || currentUserRole === 'org:admin';

    const fetchMessages = useCallback(async (id, isFirstLoad = false) => {
        if (!id) return;
        if (isFirstLoad) setIsInitialLoad(true); 

        try {
            const res = await fetch(`/api/tickets/${id}/messages`);
            const data = await res.json();

            if (res.ok) {
                setChatState(prev => ({
                    ...prev,
                    messages: data.messages || [],
                    isClosed: data.isClosed,
                }));
            } else {
                throw new Error(data.error || 'Fallo al cargar mensajes');
            }
        } catch (e) {
            console.error(e);
            setChatState(prev => ({ ...prev, error: 'No se pudieron cargar los mensajes.' }));
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        } finally {
            if (isFirstLoad) setIsInitialLoad(false); 
        }
    }, [currentUserId]);

    const markTicketAsRead = useCallback(async (id) => {
        if (!id) return;
        try {
            await fetch(`/api/tickets/${id}/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, role: currentUserRole }), 
            });
        } catch (e) {
            console.error("Error de red al marcar como leído:", e);
        }
    }, [currentUserId, currentUserRole]);

    useEffect(() => {
        const handleTicketSelection = (event) => {
            const { ticketId, userName } = event.detail;

            if (intervalRef.current) clearInterval(intervalRef.current);

            setChatState({ ...INITIAL_STATE, ticketId, userName });
            
            fetchMessages(ticketId, true);
            markTicketAsRead(ticketId);

            intervalRef.current = setInterval(() => {
                fetchMessages(ticketId, false);
            }, INITIAL_STATE.pollingInterval);
        };

        document.addEventListener('ticketSelected', handleTicketSelection);
        return () => {
            document.removeEventListener('ticketSelected', handleTicketSelection);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchMessages, markTicketAsRead]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatState.messages]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const content = newMessage.trim();
        if (!content || !chatState.ticketId || chatState.isClosed || !isAgentUser) return;

        const messageData = {
            ticketId: chatState.ticketId,
            senderId: currentUserId,
            content,
            type: 'texto', 
        };

        setNewMessage(''); // Limpiar inmediatamente para mejor UX

        try {
            const res = await fetch(`/api/tickets/${chatState.ticketId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData),
            });

            if (res.ok) {
                fetchMessages(chatState.ticketId, false); 
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Fallo al enviar el mensaje.');
                setNewMessage(content); // Restaurar contenido si falla
            }
        } catch (error) {
            console.error('Error de red al enviar mensaje:', error);
            toast.error('Error de conexión.');
            setNewMessage(content);
        }
    };

    const applyQuickReply = (reply) => {
        setNewMessage(reply);
        // Opcional: enviar automáticamente si se desea
    };

    const handleCloseTicket = async () => {
        if (!chatState.ticketId || !isAgentUser) return;
        if (!window.confirm(`¿Estás seguro de que quieres cerrar este ticket?`)) return;

        try {
            const res = await fetch(`/api/tickets/${chatState.ticketId}/close`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ closedBy: currentUserId }),
            });

            if (res.ok) {
                toast.success('Ticket cerrado exitosamente.');
                fetchMessages(chatState.ticketId, false);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Fallo al cerrar el ticket.');
            }
        } catch (error) {
            toast.error('Error al cerrar ticket.');
        }
    };

    if (!chatState.ticketId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-gray-50 dark:bg-gray-900/20">
                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                    <MessageSquare className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Bandeja de Entrada
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Selecciona una conversación del panel lateral para gestionar el ticket y responder a las consultas.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                   <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                      <Clock className="w-6 h-6 text-blue-500 mb-2" />
                      <span className="text-xs font-semibold text-gray-500 lowercase">Tiempo Respuesta</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">~15 min</span>
                   </div>
                   <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                      <CheckCheck className="w-6 h-6 text-green-500 mb-2" />
                      <span className="text-xs font-semibold text-gray-500 lowercase">Tickets Resueltos</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">94%</span>
                   </div>
                </div>
            </div>
        );
    }
    
    const { messages, userName, isClosed } = chatState;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header del Chat */}
            <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {userName}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {isClosed ? 'Ticket Cerrado' : 'Online / Ticket Activo'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    {!isClosed && isAgentUser && (
                        <button
                            onClick={handleCloseTicket}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/30"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Finalizar Chat</span>
                        </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Area de Mensajes */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {isInitialLoad && (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}
                
                {!isInitialLoad && messages.length === 0 && (
                   <div className="text-center py-10">
                       <p className="text-gray-400 dark:text-gray-500 italic text-sm">Aún no hay mensajes en esta conversación.</p>
                   </div>
                )}

                {messages.map((msg, idx) => {
                    const isSenderAgent = String(msg.sender_id) === String(currentUserId);
                    const timestamp = new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    // Lógica para agrupar mensajes por remitente
                    const prevMsg = messages[idx - 1];
                    const isGrouped = prevMsg && String(prevMsg.sender_id) === String(msg.sender_id);

                    return (
                        <div key={msg.message_id} className={`flex flex-col ${isSenderAgent ? 'items-end' : 'items-start'} ${isGrouped ? '-mt-4' : ''}`}>
                            {!isGrouped && (
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 ml-1 mr-1">
                                    {isSenderAgent ? 'Agente' : userName} • {timestamp}
                                </span>
                            )}
                            
                            <div className={`relative group max-w-[85%] md:max-w-[70%] lg:max-w-xl transition-all duration-200
                                ${isSenderAgent 
                                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm'
                                } p-4`
                            }>
                                {msg.tipo === 'imagen' && msg.url_adjunto ? (
                                    <div className="space-y-2">
                                        <img 
                                            src={msg.url_adjunto} 
                                            alt={msg.contenido} 
                                            className="max-h-72 w-full rounded-lg object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                                            onClick={() => window.open(msg.url_adjunto, '_blank')}
                                        />
                                        {msg.contenido && <p className="text-sm font-medium leading-relaxed">{msg.contenido}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm md:text-base leading-relaxed break-words">{msg.contenido}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </main>

            {/* Pie de Chat y Respuestas Rápidas */}
            <footer className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0">
                {!isClosed && isAgentUser && (
                    <div className="mb-4 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        {QUICK_REPLIES.map((reply, i) => (
                            <button
                                key={i}
                                onClick={() => applyQuickReply(reply)}
                                className="whitespace-nowrap px-4 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                )}

                {isClosed ? (
                    <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <XCircle className="w-5 h-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                            Esta conversación ha finalizado
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="relative flex items-end space-x-2">
                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                rows={1}
                                placeholder="Escribe tu mensaje aquí..."
                                className="w-full p-4 pr-12 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none shadow-inner min-h-[56px] max-h-32 scrollbar-hide overflow-y-auto"
                                disabled={!chatState.ticketId}
                            />
                            <div className="absolute right-3 bottom-3 flex space-x-1">
                                <button type="button" className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button type="button" className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors">
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transform hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:transform-none"
                            disabled={!newMessage.trim() || !chatState.ticketId}
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </form>
                )}
            </footer>
        </div>
    );
}
