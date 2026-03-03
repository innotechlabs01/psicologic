import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Image, X, Lock, Check, Clock, User, ShieldCheck } from 'lucide-react';

const ChatInterface = ({ ticketId, currentUserId, currentUserRole }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTicketClosed, setIsTicketClosed] = useState(false);
    const chatEndRef = useRef(null);

    const isAgent = currentUserRole === 'agente_soporte' || currentUserRole === 'org:admin';

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setIsTicketClosed(data.isClosed);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
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

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending || isTicketClosed) return;

        setIsSending(true);
        try {
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
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
        setIsSending(false);
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // El endpoint /api/upload-media parece no estar implementado aún en el backend actual
        alert('La función de envío de imágenes se activará próximamente.');
    };

    const handleCloseChat = async () => {
        if (!window.confirm("¿Estás seguro de que deseas cerrar esta conversación?")) return;
        const res = await fetch(`/api/tickets/${ticketId}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closedBy: currentUserId }),
        });

        if (res.ok) {
            setIsTicketClosed(true);
            fetchMessages();
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[75vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <ShieldCheck className="size-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white leading-tight">Soporte en línea</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {isTicketClosed ? 'Conversación Finalizada' : 'Conectado'}
                            </span>
                        </div>
                    </div>
                </div>

                {isAgent && !isTicketClosed && (
                    <button
                        onClick={handleCloseChat}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-semibold text-sm transition-all active:scale-95"
                    >
                        <Lock className="size-4" />
                        <span>Cerrar</span>
                    </button>
                )}
            </div>

            {/* Area de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                        <Clock className="size-12 mb-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-500">Aún no hay mensajes. ¡Di hola!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSenderMe = msg.sender_id === currentUserId;

                        return (
                            <div
                                key={msg.message_id || Math.random()}
                                className={`flex ${isSenderMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isSenderMe ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`px-4 py-3 rounded-2xl shadow-sm relative group transition-all duration-200
                                            ${isSenderMe
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'}`
                                        }
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.contenido}</p>

                                        {msg.tipo === 'imagen' && msg.url_adjunto && (
                                            <div className="mt-2 overflow-hidden rounded-xl bg-black/5">
                                                <img
                                                    src={msg.url_adjunto}
                                                    alt="Adjunto"
                                                    className="max-h-64 w-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className={`mt-1.5 flex items-center gap-2 px-1 text-[10px] uppercase tracking-wider font-bold
                                        ${isSenderMe ? 'text-indigo-400 dark:text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                        <span>{new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isSenderMe && <Check className="size-3" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input área */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                {isTicketClosed ? (
                    <div className="py-4 px-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 text-center">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                            <Lock className="size-4" />
                            Esta conversación ha sido cerrada.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex items-end gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <label className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                            <Image className="size-6" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isSending}
                            />
                        </label>

                        <textarea
                            rows={1}
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 py-2.5 px-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none max-h-[120px] scrollbar-none"
                            disabled={isSending}
                        />

                        <button
                            type="submit"
                            className={`size-10 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-lg shadow-indigo-500/20
                                ${newMessage.trim() && !isSending
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                            disabled={isSending || !newMessage.trim()}
                        >
                            {isSending ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="size-5 ml-0.5" />
                            )}
                        </button>
                    </form>
                )}
                <p className="mt-2 text-[10px] text-center text-gray-400 dark:text-gray-600 uppercase tracking-widest font-medium">
                    Soporte oficial Psicologic &bull; Cifrado Seguro
                </p>
            </div>
        </div>
    );
};

export default ChatInterface;
