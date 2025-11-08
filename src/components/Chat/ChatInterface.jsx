import React, { useState, useEffect, useRef, useCallback } from 'react';

// Define las props que Astro le pasa al Island
const ChatInterface = ({ ticketId, currentUserId, currentUserRole }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTicketClosed, setIsTicketClosed] = useState(false);
    const chatEndRef = useRef(null);

    // Identificación de roles
    const isAgent = currentUserRole === 'agente_soporte' || currentUserRole === 'org:admin';
    const isUser = currentUserRole === 'usuario_final';
    
    // --- FUNCIÓN DE POLLING (SIMULACIÓN DE TIEMPO REAL) ---
    const fetchMessages = useCallback(async () => {
        // Llama a un API Route de Astro: /api/tickets/[ticketId]/messages
        const res = await fetch(`/api/tickets/${ticketId}/messages`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data.messages);
            setIsTicketClosed(data.isClosed); // Actualiza el estado del ticket
        }
    }, [ticketId]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 4000); 
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- MANEJO DE ENVÍO DE MENSAJES DE TEXTO ---
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending || isTicketClosed) return;

        setIsSending(true);
        const res = await fetch(`/api/tickets/${ticketId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content: newMessage.trim(), 
                senderId: currentUserId,
                type: 'texto'
            }),
        });

        if (res.ok) {
            setNewMessage('');
            await fetchMessages();
        } else {
            alert('Error al enviar el mensaje.');
        }
        setIsSending(false);
    };

    // --- MANEJO DE ENVÍO DE IMÁGENES (LÓGICA CRÍTICA) ---
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Subir la imagen (lógica omitida)
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await fetch('/api/upload-media', { method: 'POST', body: formData });
        if (!uploadRes.ok) { alert('Error al subir la imagen.'); return; }
        const { url: imageUrl } = await uploadRes.json();
        
        // Enviar la URL
        const sendRes = await fetch(`/api/tickets/${ticketId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: file.name,
                senderId: currentUserId,
                type: 'imagen',
                urlAdjunto: imageUrl
            }),
        });

        if (sendRes.ok) { await fetchMessages(); } else { alert('Error al registrar el mensaje de imagen.'); }
    };

    // --- FUNCIÓN DE CIERRE DE CHAT (Solo Agentes) ---
    const handleCloseChat = async () => {
        if (!window.confirm("¿Estás seguro de que deseas cerrar esta conversación?")) return;
        const res = await fetch(`/api/tickets/${ticketId}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closedBy: currentUserId }),
        });

        if (res.ok) { setIsTicketClosed(true); alert("El chat ha sido cerrado exitosamente."); } else { alert("No se pudo cerrar el chat."); }
    };

    // --- RENDERIZADO DEL CHAT ---
    return (
        <div className="flex flex-col h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {/* Header del Chat y Botón de Cierre (sin cambios) */}
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                {/* ... (código sin cambios) ... */}
                {isAgent && !isTicketClosed && (
                    <button 
                        onClick={handleCloseChat} 
                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:bg-red-300"
                    >
                        🔒 Cerrar Conversación
                    </button>
                )}
                {isTicketClosed && (
                     <span className="text-red-500 dark:text-red-400 font-bold">CHAT CERRADO</span>
                )}
            </div>

            {/* Área de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    // Determinar si el mensaje fue enviado por el usuario actual (el cliente)
                    const isSenderClient = msg.sender_id === currentUserId;
                    
                    // Si NO es el cliente, asumimos que es el Agente/Soporte
                    const senderLabel = isSenderClient ? 'Tú (Cliente)' : 'Soporte Técnico';
                    const labelClass = isSenderClient ? 
                        'text-blue-100 font-bold' : 
                        'text-gray-900 dark:text-white font-bold'; // Etiqueta del agente

                    return (
                        <div 
                            key={msg.message_id} 
                            className={`flex ${isSenderClient ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow 
                                    ${isSenderClient 
                                        // Mensajes del Cliente (azul/índigo)
                                        ? 'bg-blue-600 text-white rounded-br-none dark:bg-indigo-600' 
                                        // Mensajes del Agente/Soporte (claro/oscuro)
                                        : 'bg-gray-200 text-gray-800 rounded-tl-none dark:bg-gray-600 dark:text-gray-100'}`
                                }
                            >
                                {/* 💡 NUEVA CABECERA DEL REMITENTE */}
                                <p className={`text-xs mb-1 ${labelClass}`}>
                                    {senderLabel}
                                </p>
                                
                                {/* Mostrar Contenido o Imagen */}
                                {msg.tipo === 'imagen' && msg.url_adjunto ? (
                                    <a href={msg.url_adjunto} target="_blank" rel="noopener noreferrer">
                                        <img 
                                            src={msg.url_adjunto} 
                                            alt={msg.contenido} 
                                            className="max-h-48 w-auto rounded object-cover cursor-pointer"
                                        />
                                        <p className="mt-1 text-sm italic">{msg.contenido || 'Imagen Adjunta'}</p>
                                    </a>
                                ) : (
                                    <p>{msg.contenido}</p>
                                )}
                                
                                {/* Timestamp */}
                                <p className={`text-xs mt-1 ${isSenderClient ? 'text-blue-200 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-300'} text-right`}>
                                    {new Date(msg.fecha_envio).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            {/* Formulario de Input (Ajustado para Dark Mode) */}
            <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                {isTicketClosed ? (
                    <div className="text-center text-red-600 dark:text-red-400 font-semibold p-2">
                        Esta conversación está cerrada y no se pueden enviar más mensajes.
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        {/* Botón de Adjuntar Imagen */}
                        <label className="cursor-pointer text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageUpload}
                                disabled={isSending}
                            />
                        </label>
                        
                        {/* Campo de Texto */}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            // Clases ajustadas para visibilidad en Dark Mode
                            className="flex-1 p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
                            disabled={isSending}
                        />

                        {/* Botón de Enviar (Ajustado para visibilidad) */}
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition disabled:bg-gray-400 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:disabled:bg-gray-500"
                            disabled={isSending || !newMessage.trim()}
                        >
                            {isSending ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ChatInterface;
