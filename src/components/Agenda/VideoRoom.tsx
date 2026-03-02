"use client";

import React from "react";
import { Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
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
                <div className="flex-1 bg-muted rounded-xl overflow-hidden relative flex items-center justify-center">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {status !== "connected" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                            <div className="text-center">
                                <div className="animate-spin text-4xl mb-2">↻</div>
                                <p className="font-medium">Esperando conexión...</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Asegúrate que la otra persona ha entrado.
                                </p>
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
