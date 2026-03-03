"use client";

import React from "react";
import { Video, Mic, MicOff, VideoOff, PhoneOff, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useWebRTC } from "./hooks/useWebRTC";

interface VideoRoomProps {
    meetingToken: string;
    userType: "host" | "client";
}

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
    } = useWebRTC({ meetingToken, userType });

    // Debug identifying role
    React.useEffect(() => {
        console.log(`[WebRTC] Estás entrando como: ${userType.toUpperCase()}`);
        console.log(`[WebRTC] Token de reunión: ${meetingToken}`);
    }, [userType, meetingToken]);

    return (
        <div className="flex flex-col h-screen bg-background text-foreground p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Sala de Consulta
                    {status === "connected" && (
                        <span className="inline-block size-2 rounded-full bg-green-500" />
                    )}
                </h2>
                <div className="text-sm text-muted-foreground">
                    Token: {meetingToken.substring(0, 8)}...
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 flex gap-4 relative">
                {/* Remote Video (Main) */}
                <div className="flex-1 bg-muted rounded-xl overflow-hidden relative flex items-center justify-center border border-border shadow-inner">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {status !== "connected" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90 backdrop-blur-sm transition-all duration-500">
                            <div className="text-center p-8 max-w-sm">
                                {status === "error" ? (
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <div className="bg-red-500/10 text-red-500 p-4 rounded-full size-20 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                            <AlertTriangle className="size-10" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-2">Error de Acceso</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                                            No pudimos acceder a tu cámara o micrófono. Por favor, verifica los permisos de tu navegador.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800"
                                            onClick={() => window.location.reload()}
                                        >
                                            Intentar de nuevo
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                                            <div className="relative flex items-center justify-center size-20 bg-indigo-600 rounded-2xl mx-auto shadow-2xl shadow-indigo-500/20">
                                                <Loader2 className="size-10 text-white animate-spin" />
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-3">Preparando Sala</h3>
                                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                            Estableciendo conexión segura... {userType === 'host' ? 'Esperando al paciente.' : 'Esperando al doctor.'}
                                        </p>
                                        <div className="mt-8 flex gap-2 justify-center">
                                            <span className="size-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="size-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="size-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (PIP) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-muted rounded-lg overflow-hidden border-2 border-border shadow-xl">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <VideoOff className="size-8 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="h-20 flex items-center justify-center gap-6 mt-4">
                <button
                    className={`p-4 rounded-full transition-colors ${isAudioMuted
                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        : "bg-muted hover:bg-accent"
                        }`}
                    onClick={toggleAudio}
                    title={isAudioMuted ? "Activar micrófono" : "Silenciar micrófono"}
                >
                    {isAudioMuted ? <MicOff /> : <Mic />}
                </button>

                <button
                    className={`p-4 rounded-full transition-colors ${isVideoOff
                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        : "bg-muted hover:bg-accent"
                        }`}
                    onClick={toggleVideo}
                    title={isVideoOff ? "Activar cámara" : "Desactivar cámara"}
                >
                    {isVideoOff ? <VideoOff /> : <Video />}
                </button>

                <button
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white w-16 h-16 flex items-center justify-center transition-colors"
                    onClick={endCall}
                    title="Finalizar llamada"
                >
                    <PhoneOff />
                </button>
            </div>
        </div>
    );
};

export default VideoRoom;
