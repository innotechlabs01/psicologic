"use client";

import React, { useState, useCallback } from "react";
import {
    Video,
    Mic,
    MicOff,
    VideoOff,
    PhoneOff,
    AlertTriangle,
    Loader2,
    MoreVertical,
    Users,
} from "lucide-react";
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

    React.useEffect(() => {
        showControls();
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    React.useEffect(() => {
        console.log(`[VideoRoom] Rol: ${userType.toUpperCase()} | Token: ${meetingToken}`);
    }, [userType, meetingToken]);

    return (
        <>
            {/* ── Global keyframe styles ── */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1);    }
                }
                @keyframes burstRing {
                    0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.8; }
                    100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0;   }
                }
                @keyframes controlsFadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0);     }
                }
                @keyframes pipIn {
                    from { opacity: 0; transform: scale(0.85); }
                    to   { opacity: 1; transform: scale(1);    }
                }
            `}</style>

            <div
                className="relative flex flex-col h-screen bg-zinc-950 text-white overflow-hidden select-none"
                onMouseMove={showControls}
                onTouchStart={showControls}
            >
                {/* ── Background gradient mesh ── */}
                <div className="pointer-events-none absolute inset-0 z-0">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-700/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-700/8 rounded-full blur-3xl" />
                </div>

                {/* ── Header ── */}
                <div
                    className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2"
                    style={{
                        opacity: controlsVisible ? 1 : 0,
                        transition: "opacity 0.4s ease",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                            <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/40">
                                <Users className="size-3.5" />
                            </span>
                            Sala de Consulta
                        </div>
                        <StatusBadge status={status} />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-mono">
                            {meetingToken.substring(0, 10)}…
                        </span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/8 transition-colors">
                            <MoreVertical className="size-4" />
                        </button>
                    </div>
                </div>

                {/* ── Video area ── */}
                <div className="relative flex-1 z-10 px-4">
                    {/* Remote video */}
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/8 shadow-2xl shadow-black/60 relative">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Floating emoji layer */}
                        <EmojiReaction reactions={reactions} />

                        {/* Incoming reaction toast */}
                        <EmojiToast emoji={toast.emoji} visible={toast.visible} />

                        {/* Overlay when not connected */}
                        {status !== "connected" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md">
                                <div className="text-center p-8 max-w-sm">
                                    {status === "error" ? (
                                        <div
                                            style={{ animation: "controlsFadeIn 0.3s ease forwards" }}
                                        >
                                            <div className="mx-auto mb-5 w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                                <AlertTriangle className="size-9 text-red-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">
                                                Error de Acceso
                                            </h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                                                No pudimos acceder a tu cámara o micrófono. Verifica los
                                                permisos del navegador.
                                            </p>
                                            <button
                                                className="text-sm border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                                                onClick={() => window.location.reload()}
                                            >
                                                Intentar de nuevo
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            style={{ animation: "controlsFadeIn 0.5s ease forwards" }}
                                        >
                                            <div className="relative mx-auto mb-6 w-20 h-20">
                                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                                                <div className="relative w-full h-full rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-900/40">
                                                    <Loader2 className="size-9 text-white animate-spin" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-3">
                                                Preparando sala
                                            </h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                {userType === "host"
                                                    ? "Esperando al paciente…"
                                                    : "Esperando al doctor…"}
                                            </p>
                                            <div className="mt-8 flex gap-2 justify-center">
                                                {[0.3, 0.15, 0].map((d, i) => (
                                                    <span
                                                        key={i}
                                                        className="size-1.5 rounded-full bg-indigo-500 animate-bounce"
                                                        style={{ animationDelay: `-${d}s` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── PIP Local video ── */}
                    <div
                        className="absolute bottom-4 right-8 w-44 h-32 rounded-xl overflow-hidden border border-white/15 shadow-2xl shadow-black/60 bg-zinc-900 group cursor-pointer"
                        style={{ animation: "pipIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                        />

                        {/* Muted mic badge on PIP */}
                        {isAudioMuted && (
                            <div className="absolute top-2 left-2 bg-red-600/90 text-white rounded-full p-1">
                                <MicOff className="size-3" />
                            </div>
                        )}

                        {/* Video off overlay */}
                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/90">
                                <VideoOff className="size-7 text-zinc-400" />
                            </div>
                        )}

                        {/* "Tú" label */}
                        <div className="absolute bottom-2 left-2 text-xs font-medium text-white/70 bg-black/40 rounded px-1.5 py-0.5 backdrop-blur-sm">
                            Tú
                        </div>

                        {/* Audio activity ring on PIP */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                            <AudioActivityIndicator
                                stream={localStream ?? null}
                                muted={isAudioMuted}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Controls bar ── */}
                <div
                    className="relative z-10 flex flex-col items-center gap-3 py-4 px-4"
                    style={{
                        opacity: controlsVisible ? 1 : 0,
                        transform: controlsVisible ? "translateY(0)" : "translateY(16px)",
                        transition: "opacity 0.4s ease, transform 0.4s ease",
                    }}
                >
                    {/* Quick reactions strip */}
                    <QuickReactions onSelect={sendReaction} />

                    {/* Main control row */}
                    <div className="flex items-center gap-3">
                        {/* Mic */}
                        <div className="relative">
                            <ControlButton
                                onClick={toggleAudio}
                                active={isAudioMuted}
                                activeClass="bg-red-500/20 text-red-400 border-red-500/30"
                                title={isAudioMuted ? "Activar micrófono" : "Silenciar"}
                            >
                                {isAudioMuted ? (
                                    <MicOff className="size-5" />
                                ) : (
                                    <Mic className="size-5" />
                                )}
                            </ControlButton>
                            {/* Audio activity ring on mic button */}
                            {!isAudioMuted && (
                                <div className="absolute inset-0 rounded-full pointer-events-none">
                                    <AudioActivityIndicator
                                        stream={localStream ?? null}
                                        muted={isAudioMuted}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Camera */}
                        <ControlButton
                            onClick={toggleVideo}
                            active={isVideoOff}
                            activeClass="bg-red-500/20 text-red-400 border-red-500/30"
                            title={isVideoOff ? "Activar cámara" : "Apagar cámara"}
                        >
                            {isVideoOff ? (
                                <VideoOff className="size-5" />
                            ) : (
                                <Video className="size-5" />
                            )}
                        </ControlButton>

                        {/* Emoji picker */}
                        <EmojiPicker
                            isOpen={pickerOpen}
                            onToggle={() => setPickerOpen((v) => !v)}
                            onSelect={sendReaction}
                        />

                        {/* End call */}
                        <ControlButton
                            onClick={endCall}
                            danger
                            size="lg"
                            title="Finalizar llamada"
                        >
                            <PhoneOff className="size-5" />
                        </ControlButton>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VideoRoom;