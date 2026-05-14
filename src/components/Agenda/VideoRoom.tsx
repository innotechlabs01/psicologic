"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Video, 
    Mic, 
    MicOff, 
    VideoOff, 
    PhoneOff, 
    AlertTriangle, 
    Loader2,
    Maximize2,
    Settings,
    User,
    Wifi
} from "lucide-react";
import { Button } from "./ui/button";
import { useWebRTC } from "./hooks/useWebRTC";
import { useEmojiReactions } from "./hooks/Useemojireactions ";
import AudioActivityIndicator from "./VideoRoom/Audioactivityindicator";
import EmojiPicker, { ControlButton } from "./VideoRoom/EmojiPicker";
import EmojiReaction from "./VideoRoom/EmojiReaction";


// ─────────────────────────────────────────────
//  Quick Reactions bar (bottom shortcut strip)
// ─────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "👏", "🔥"];

interface QuickReactionsProps {
    onSelect: (emoji: string) => void;
}

const QuickReactions: React.FC<QuickReactionsProps> = ({ onSelect }) => (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm">
        {QUICK_EMOJIS.map((e) => (
            <button
                key={e}
                onClick={() => onSelect(e)}
                className="text-xl transition-all duration-150 hover:scale-150 active:scale-90 select-none"
                title={e}
            >
                {e}
            </button>
        ))}
    </div>
);

// ─────────────────────────────────────────────
//  Connection status badge
// ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string; color: string; dot: string }> = {
        connected: {
            label: "Conectado",
            color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
            dot: "bg-emerald-400",
        },
        connecting: {
            label: "Conectando…",
            color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
            dot: "bg-amber-400 animate-pulse",
        },
        waiting: {
            label: "Esperando",
            color: "bg-sky-500/15 text-sky-400 border-sky-500/30",
            dot: "bg-sky-400 animate-pulse",
        },
        error: {
            label: "Error",
            color: "bg-red-500/15 text-red-400 border-red-500/30",
            dot: "bg-red-400",
        },
    };

    const cfg = map[status] ?? map["connecting"];

    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border backdrop-blur-sm ${cfg.color}`}
        >
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────
//  Emoji toast notification
// ─────────────────────────────────────────────
const EmojiToast: React.FC<{ emoji: string; visible: boolean }> = ({ emoji, visible }) => (
    <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-12px)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
    >
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm text-sm text-zinc-300">
            <span className="text-lg">{emoji}</span>
            El otro participante reaccionó
        </div>
    </div>
);

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────
interface VideoRoomProps {
    meetingToken: string;
    userType: "host" | "client";
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────
const VideoRoom: React.FC<VideoRoomProps> = ({ meetingToken, userType }) => {
    const {
        status,
        localVideoRef,
        remoteVideoRef,
        isAudioMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo,
        endCall,
        localStream,       // expose from hook if available (optional)
        sendDataMessage,   // expose from hook if available (optional)
    } = useWebRTC({ meetingToken, userType }) as ReturnType<typeof useWebRTC> & {
        localStream?: MediaStream | null;
        sendDataMessage?: (msg: string) => void;
    };

    // ── Emoji reactions ──
    const sendReactionViaDC = useCallback(
        (emoji: string) => {
            sendDataMessage?.(JSON.stringify({ type: "reaction", emoji }));
        },
        [sendDataMessage]
    );

    const { reactions, sendReaction, receiveReaction } = useEmojiReactions(sendReactionViaDC);

    // Toast for incoming remote reactions
    const [toast, setToast] = useState<{ emoji: string; visible: boolean }>({
        emoji: "",
        visible: false,
    });
    const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleRemoteReaction = useCallback(
        (emoji: string) => {
            receiveReaction(emoji);
            setToast({ emoji, visible: true });
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(
                () => setToast((t) => ({ ...t, visible: false })),
                2500
            );
        },
        [receiveReaction]
    );

    // If useWebRTC exposes a way to subscribe to data messages, wire it up here.
    // e.g.: useEffect(() => { onDataMessage?.((raw) => { ... }) }, [onDataMessage])

    // ── Emoji picker state ──
    const [pickerOpen, setPickerOpen] = useState(false);

    // ── Controls hover state for auto-hide ──
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const showControls = useCallback(() => {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (status === "connected") setControlsVisible(false);
        }, 4000);
    }, [status]);

    const [isControlsVisible, setIsControlsVisible] = useState(true);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleMouseMove = () => {
            setIsControlsVisible(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (status === "connected") setIsControlsVisible(false);
            }, 3000);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [status]);

    return (
        <div className="relative flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans select-none">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center transition-all duration-500 transform ${isControlsVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                        <div className={`size-2 rounded-full ${status === "connected" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-500"} animate-pulse`} />
                        <span className="text-sm font-semibold tracking-wide">
                            {status === "connected" ? "SESIÓN EN VIVO" : "CONECTANDO..."}
                        </span>
                    </div>
                    {status === "connected" && (
                        <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5 text-zinc-400 text-xs font-medium">
                            <Wifi className="size-3" />
                            <span>HD Dinámico</span>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400">
                        <Settings className="size-5" />
                    </Button>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono tracking-tight text-zinc-400">
                        REF: {meetingToken.substring(0, 8).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
                {/* Remote Video Container */}
                <div className="relative w-full h-full max-w-7xl mx-auto rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-700">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${status === "connected" ? "opacity-100" : "opacity-0"}`}
                    />

                    {/* Placeholder when disconnected or waiting */}
                    {status !== "connected" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
                                <div className="relative bg-zinc-800/50 backdrop-blur-xl size-24 md:size-32 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
                                    {status === "error" ? (
                                        <AlertTriangle className="size-10 md:size-14 text-rose-500" />
                                    ) : (
                                        <User className="size-10 md:size-14 text-zinc-500" />
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-center px-6 max-w-md">
                                <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                                    {status === "error" ? "Error de Conexión" : "Sala de Espera"}
                                </h3>
                                <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                                    {status === "error" 
                                        ? "Hubo un problema con los medios. Verifica que no haya otra pestaña usando tu cámara." 
                                        : (userType === "host" ? "Esperando a que el paciente se una a la sesión..." : "El doctor aún no ha iniciado la sesión. Por favor, espera un momento.")
                                    }
                                </p>
                                {status === "error" && (
                                    <Button 
                                        onClick={() => window.location.reload()}
                                        className="mt-6 bg-white text-black hover:bg-zinc-200 rounded-full px-8 py-6 font-bold"
                                    >
                                        Reintentar
                                    </Button>
                                )}
                            </div>
                            
                            {status === "connecting" && (
                                <div className="mt-12 flex flex-col items-center gap-4">
                                    <Loader2 className="size-8 text-indigo-500 animate-spin" />
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Sincronizando...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Local Video PIP */}
                    <div className={`absolute bottom-6 right-6 w-32 h-44 md:w-56 md:h-72 bg-zinc-950 rounded-[1.5rem] overflow-hidden border border-white/20 shadow-2xl transition-all duration-500 z-30 group ${status !== "connected" ? "scale-100" : "hover:scale-105"}`}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isVideoOff ? "opacity-0" : "opacity-100"}`}
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-3">
                                <div className="size-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <VideoOff className="size-5 text-zinc-500" />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Cámara off</span>
                            </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-1 items-center bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="size-1.5 rounded-full bg-emerald-500" />
                           <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Tú</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 z-50 p-8 flex justify-center items-center transition-all duration-500 transform ${isControlsVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
                <div className="bg-zinc-900/60 backdrop-blur-2xl px-8 py-4 rounded-[2.5rem] border border-white/10 flex items-center gap-6 shadow-2xl">
                    <button
                        onClick={toggleAudio}
                        className={`size-14 rounded-full flex items-center justify-center border transition-all duration-300 ${isAudioMuted 
                            ? "bg-rose-500/20 border-rose-500/30 text-rose-500" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
                        title={isAudioMuted ? "Activar audio" : "Silenciar audio"}
                    >
                        {isAudioMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`size-14 rounded-full flex items-center justify-center border transition-all duration-300 ${isVideoOff 
                            ? "bg-rose-500/20 border-rose-500/30 text-rose-500" 
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
                        title={isVideoOff ? "Activar video" : "Apagar video"}
                    >
                        {isVideoOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2" />

                    <button
                        onClick={endCall}
                        className="size-16 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-300 shadow-[0_10px_30px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_40px_rgba(225,29,72,0.4)]"
                        title="Finalizar consulta"
                    >
                        <PhoneOff className="size-7" />
                    </button>
                    
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    
                    <button
                        className="size-14 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                        onClick={() => {
                           if (document.fullscreenElement) document.exitFullscreen();
                           else document.documentElement.requestFullscreen();
                        }}
                    >
                        <Maximize2 className="size-6 text-zinc-400" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoRoom;