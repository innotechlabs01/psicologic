import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

interface VideoRoomProps {
    meetingToken: string;
    userType: 'host' | 'client'; // URL param or prop
}

const VideoRoom: React.FC<VideoRoomProps> = ({ meetingToken, userType }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const lastSignalId = useRef(0);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    // Initialize WebRTC
    useEffect(() => {
        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        // Add TURN servers here for production
                    ]
                });

                stream.getTracks().forEach(track => pc.addTrack(track, stream));

                pc.ontrack = (event) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        await sendSignal('ice-candidate', event.candidate);
                    }
                };

                pc.onconnectionstatechange = () => {
                    if (pc.connectionState === 'connected') setStatus('connected');
                    if (pc.connectionState === 'disconnected') setStatus('disconnected');
                    if (pc.connectionState === 'failed') setStatus('error');
                };

                peerConnection.current = pc;

                // Start Polling for signals
                startPolling();

                // If Host, create offer
                if (userType === 'host') {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await sendSignal('offer', offer);
                }

            } catch (err) {
                console.error("Error initializing video:", err);
                setStatus('error');
            }
        };

        init();

        return () => {
            if (localStream) localStream.getTracks().forEach(t => t.stop());
            if (peerConnection.current) peerConnection.current.close();
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [meetingToken, userType]);

    const sendSignal = async (type: string, payload: any) => {
        await fetch('/api/agenda/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                meetingToken,
                type,
                payload,
                sender: userType
            })
        });
    };

    const handleSignal = async (signal: any) => {
        const pc = peerConnection.current;
        if (!pc) return;

        if (signal.type === 'offer' && userType === 'client') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal('answer', answer);
        } else if (signal.type === 'answer' && userType === 'host') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        } else if (signal.type === 'ice-candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
        }
    };

    const startPolling = () => {
        pollingInterval.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/agenda/signaling?token=${meetingToken}&afterId=${lastSignalId.current}`);
                const signals = await res.json();

                for (const signal of signals) {
                    if (signal.id > lastSignalId.current) {
                        lastSignalId.current = signal.id;
                        // Don't process our own signals
                        if (signal.sender !== userType) {
                            await handleSignal(signal);
                        }
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 1000); // Poll every second
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Sala de Consulta {status === 'connected' && '🟢'}</h2>
                <div className="text-sm text-gray-400">Token: {meetingToken.substring(0, 8)}...</div>
            </div>

            <div className="flex-1 flex gap-4 relative">
                {/* Remote Video (Main) */}
                <div className="flex-1 bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {status !== 'connected' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80">
                            <div className="text-center">
                                <div className="animate-spin text-4xl mb-2">↻</div>
                                <p>Esperando conexión...</p>
                                <p className="text-xs text-gray-400 mt-2">Asegúrate que la otra persona ha entrado.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Local Video (PIP) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-xl">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>
            </div>

            <div className="h-20 flex items-center justify-center gap-6 mt-4">
                <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600"><Mic /></button>
                <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600"><Video /></button>
                <button className="p-4 rounded-full bg-red-600 hover:bg-red-700 w-16 h-16 flex items-center justify-center" onClick={() => window.close()}>
                    <PhoneOff />
                </button>
            </div>
        </div>
    );
};

export default VideoRoom;
