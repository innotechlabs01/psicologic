import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';

interface VideoRoomProps {
    meetingToken: string;
    userType: 'host' | 'client';
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const VideoRoom: React.FC<VideoRoomProps> = ({ meetingToken, userType }) => {
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'connected' | 'disconnected'>('connecting');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastMessageId, setLastMessageId] = useState(0);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const getLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setError('No se pudo acceder a la cámara o micrófono');
            setStatus('disconnected');
            return null;
        }
    }, []);

    const createPeerConnection = useCallback((stream: MediaStream) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setStatus('connected');
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal('ice-candidate', event.candidate);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setStatus('connected');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setStatus('disconnected');
            }
        };

        peerConnection.current = pc;
        return pc;
    }, []);

    const sendSignal = async (type: string, payload: any) => {
        try {
            await fetch('/api/agenda/signaling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingToken, type, payload, sender: userType })
            });
        } catch (err) {
            console.error('Error sending signal:', err);
        }
    };

    const pollForSignals = useCallback(async () => {
        try {
            const res = await fetch(`/api/agenda/signaling?token=${meetingToken}&afterId=${lastMessageId}`);
            const messages = await res.json();

            if (messages.length > 0) {
                const pc = peerConnection.current;
                if (!pc) return;

                for (const msg of messages) {
                    setLastMessageId(msg.id);

                    if (msg.sender === userType) continue;

                    const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;

                    if (msg.type === 'offer' && userType === 'client') {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await sendSignal('answer', answer);
                    } else if (msg.type === 'answer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                    } else if (msg.type === 'ice-candidate') {
                        await pc.addIceCandidate(new RTCIceCandidate(payload));
                    }
                }
            }
        } catch (err) {
            console.error('Error polling signals:', err);
        }
    }, [meetingToken, userType, lastMessageId]);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const stream = await getLocalStream();
            if (!stream || !mounted) return;

            const pc = createPeerConnection(stream);

            pollingRef.current = setInterval(pollForSignals, 2000);

            if (userType === 'host') {
                setStatus('waiting');
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await sendSignal('offer', offer);
                } catch (err) {
                    console.error('Error creating offer:', err);
                }
            } else {
                setStatus('waiting');
            }
        };

        init();

        return () => {
            mounted = false;
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
        };
    }, []);

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoEnabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isAudioEnabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const endCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        window.location.href = '/client/agenda';
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <VideoOff className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Error de Conexión</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary rounded-lg font-medium hover:bg-primary/90"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <div className="flex-1 relative overflow-hidden">
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg bg-gray-800">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                    />
                    {!isVideoEnabled && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-400">
                                    {userType === 'host' ? 'T' : 'P'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white">Iniciando videollamada...</p>
                        </div>
                    </div>
                )}

                {status === 'waiting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                                <Video className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-white font-medium">Esperando al otro participante...</p>
                            <p className="text-gray-400 text-sm mt-2">La conexión se establecera automaticamente</p>
                        </div>
                    </div>
                )}

                {status === 'connected' && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-500 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-sm font-medium">Conectado</span>
                    </div>
                )}
            </div>

            <div className="h-20 bg-gray-800 flex items-center justify-center gap-4 px-4">
                <button
                    onClick={toggleAudio}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        isAudioEnabled 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                >
                    {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        isVideoEnabled 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                >
                    {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>

                <button
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                >
                    <Phone size={20} className="rotate-[135deg]" />
                </button>
            </div>
        </div>
    );
};
