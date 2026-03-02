import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

const AGENT_ROLE = 'agente_soporte';

// Estado inicial cuando no hay ticket seleccionado
const INITIAL_STATE = {
    ticketId: null,
    userName: null,
    messages: [],
    isClosed: false,
    // Eliminamos isLoading del INITIAL_STATE para controlarlo por separado
    error: null,
    pollingInterval: 5000, 
};

export default function ChatInterfaceAdmin({ currentUserId, currentUserRole }) {
    const [chatState, setChatState] = useState(INITIAL_STATE);
    const [newMessage, setNewMessage] = useState('');
    // 🆕 Estado para controlar solo la primera carga (evita que 'Cargando...' salga en el polling)
    const [isInitialLoad, setIsInitialLoad] = useState(false); 
    const chatEndRef = useRef(null);
    const intervalRef = useRef(null);
    
    const isAgentUser = currentUserRole === AGENT_ROLE || currentUserRole === 'org:admin';


    // ------------------------------------------------
    // 1. Lógica de Polling para obtener mensajes
    // ------------------------------------------------
    const fetchMessages = useCallback(async (id, isFirstLoad = false) => {
        if (!id) return;
        
        // 🚨 Solo mostramos el loader si es la carga inicial del ticket
        if (isFirstLoad) {
            setIsInitialLoad(true); 
        }

        try {
            const res = await fetch(`/api/tickets/${id}/messages`);
            const data = await res.json();

            if (res.ok) {
                setChatState(prev => ({
                    ...prev,
                    messages: data.messages || [],
                    isClosed: data.isClosed,
                }));


                const isSenderAgent = String(data.messages?.[0]?.sender_id) === String(currentUserId);

                console.log(`
                    isSenderAgent: ${isSenderAgent}
                    isAgentUser: ${isAgentUser}
                `)
            } else {
                throw new Error(data.error || 'Fallo al cargar mensajes');
            }
        } catch (e) {
            console.error(e);
            setChatState(prev => ({ ...prev, error: 'No se pudieron cargar los mensajes.' }));
            // Detener polling en caso de error grave
            clearInterval(intervalRef.current); 
            intervalRef.current = null;
        } finally {
            // 🛑 Siempre ocultamos el loader al terminar la petición
            if (isFirstLoad) {
                setIsInitialLoad(false); 
            }
            // NOTA: El polling ahora es silencioso, sin afectar el estado isLoading
        }
    }, []);

    // ------------------------------------------------
    // 1.5. Nueva Lógica: Marcar Ticket como Leído por el Agente
    // ------------------------------------------------
    const markTicketAsRead = useCallback(async (id) => {
        if (!id) return;
        try {
            // Este endpoint debe actualizar el campo en la tabla de Tickets o el mensaje
            // Asumimos que estás actualizando el ticket para indicar que el agente lo vio.
            const res = await fetch(`/api/tickets/${id}/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Opcional: Si necesitas indicar quién lo leyó
                body: JSON.stringify({ userId: currentUserId, role: currentUserRole }), 
            });

            if (!res.ok) {
                console.error("Fallo al marcar el ticket como leído.");
                // No mostramos toast al usuario, es una acción de fondo
            }
        } catch (e) {
            console.error("Error de red al marcar como leído:", e);
        }
    }, [currentUserId, currentUserRole]);

    // ------------------------------------------------
    // 2. Manejo de Selección de Ticket (Desde Astro)
    // ------------------------------------------------
    useEffect(() => {
        const handleTicketSelection = (event) => {
            const { ticketId, userName } = event.detail;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            // Reiniciar estado
            setChatState({
                ...INITIAL_STATE,
                ticketId,
                userName,
            });
            
            // 🌟 Carga inicial (true)
            fetchMessages(ticketId, true);
            
            // 🌟 NUEVO: Marcar inmediatamente como leído al abrir el chat
            markTicketAsRead(ticketId);

            // Iniciar Polling (sin mostrar el loader)
            intervalRef.current = setInterval(() => {
                fetchMessages(ticketId, false); // false = no es carga inicial
            }, INITIAL_STATE.pollingInterval);
        };

        document.addEventListener('ticketSelected', handleTicketSelection);

        return () => {
            document.removeEventListener('ticketSelected', handleTicketSelection);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchMessages]);

    // ... (3. Scroll al final, 4. Envío de Mensaje, 5. Cerrar Ticket se mantienen iguales) ...
    // [CÓDIGO OMITIDO POR BREVEDAD - SON LOS MISMO QUE EL ORIGINAL]
    // ...

    // ------------------------------------------------
    // 3. Scroll al final
    // ------------------------------------------------
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatState.messages]);

    // ------------------------------------------------
    // 4. Lógica de Envío de Mensaje
    // ------------------------------------------------
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatState.ticketId || chatState.isClosed || !isAgentUser) return;

        const messageData = {
            ticketId: chatState.ticketId,
            senderId: currentUserId, // ID interno del Agente
            content: newMessage.trim(),
            type: 'texto', 
        };

        try {
            const res = await fetch(`/api/tickets/${chatState.ticketId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData),
            });

            if (res.ok) {
                setNewMessage('');
                // Forzar la actualización inmediata tras el envío, no es carga inicial
                fetchMessages(chatState.ticketId, false); 
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Fallo al enviar el mensaje.');
            }
        } catch (error) {
            console.error('Error de red al enviar mensaje:', error);
            toast.error('Error de conexión. Inténtalo de nuevo.');
        }
    };
    
    // ------------------------------------------------
    // 5. Lógica de Cerrar Ticket
    // ------------------------------------------------
    const handleCloseTicket = async () => {
        if (!chatState.ticketId || !isAgentUser) return;

        if (!window.confirm(`¿Estás seguro de que quieres cerrar el ticket ${chatState.ticketId.substring(0, 8)}...?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/tickets/${chatState.ticketId}/close`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ closedBy: currentUserId }),
            });

            if (res.ok) {
                toast.success('Ticket cerrado exitosamente. Refresca la lista para verlo actualizado.');
                // Forzar re-fetch para actualizar el estado del chat a isClosed
                fetchMessages(chatState.ticketId, false);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Fallo al cerrar el ticket.');
            }

        } catch (error) {
            console.error('Error de red al cerrar ticket:', error);
            toast.error('Error de conexión al cerrar ticket.');
        }
    };

    // ------------------------------------------------
    // 6. Renderizado
    // ------------------------------------------------

    if (!chatState.ticketId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <svg className="w-20 h-20 text-indigo-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <h2 className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2">
                    Selecciona una Conversación
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground">
                    Haz clic en un ticket de la izquierda para comenzar a responder.
                </p>
            </div>
        );
    }
    
    const { messages, userName, isClosed } = chatState;

    return (
        <div className="flex flex-col h-full bg-card dark:bg-gray-800">
            {/* Cabecera del Chat con Botón de Cerrar */}
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-card dark:bg-gray-800 z-10">
                <h3 className="text-xl font-bold text-foreground dark:text-gray-100">
                    Chat con: {userName}
                </h3>
                {!isClosed && isAgentUser && (
                    <button
                        onClick={handleCloseTicket}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-150 shadow-md"
                    >
                        ❌ Cerrar Ticket
                    </button>
                )}
                {isClosed && (
                     <span className="px-4 py-2 bg-muted/500 text-white font-semibold rounded-lg">
                        TICKET CERRADO
                     </span>
                )}
            </div>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 🚨 Solo mostrar el loader si es la carga inicial */}
                {isInitialLoad && <p className="text-center text-indigo-500 dark:text-indigo-300">Cargando mensajes...</p>}
                
                {(!isInitialLoad || messages.length > 0) && messages.map((msg) => {
                    const isSenderAgent = String(msg.sender_id) === String(currentUserId);
                    const timestamp = new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                        <div key={msg.message_id} className={`flex ${isSenderAgent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md 
                                ${isSenderAgent 
                                    ? 'bg-indigo-600 text-white rounded-br-none dark:bg-indigo-700' 
                                    : 'bg-gray-200 text-foreground rounded-tl-none dark:bg-gray-700 dark:text-white'
                                }`
                            }>
                                <p className="font-medium text-sm mb-1">
                                    {isSenderAgent ? 'Tú (Agente)' : userName || '(Cliente)'}
                                </p>
                                
                                {msg.tipo === 'imagen' && msg.url_adjunto ? (
                                    <a href={msg.url_adjunto} target="_blank" rel="noopener noreferrer" className="block">
                                        <img 
                                            src={msg.url_adjunto} 
                                            alt={msg.contenido} 
                                            className="max-h-48 w-auto rounded object-cover cursor-pointer"
                                        />
                                        <p className="mt-1 text-sm italic">{msg.contenido || 'Imagen Adjunta'}</p>
                                    </a>
                                ) : (
                                    <p className="text-base break-words">{msg.contenido}</p>
                                )}
                                
                                <span className={`text-xs mt-1 block text-right opacity-70 
                                    ${isSenderAgent ? 'text-indigo-200' : 'text-muted-foreground dark:text-muted-foreground'}`
                                }>
                                    {timestamp}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Formulario de Respuesta */}
            <div className="p-4 border-t dark:border-gray-700 bg-card dark:bg-gray-800">
                {isClosed ? (
                    <p className="text-center text-red-500 dark:text-red-400 font-bold">
                        El ticket ha sido cerrado. No se pueden enviar más mensajes.
                    </p>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex space-x-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="flex-1 p-3 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white transition-shadow"
                            disabled={!chatState.ticketId}
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md disabled:bg-indigo-400"
                            disabled={!newMessage.trim() || !chatState.ticketId}
                        >
                            Enviar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
