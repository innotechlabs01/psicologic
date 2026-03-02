"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseWebRTCOptions {
    meetingToken: string;
    userType: "host" | "client";
}

interface UseWebRTCReturn {
    status: "connecting" | "connected" | "disconnected" | "error";
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    isAudioMuted: boolean;
    isVideoOff: boolean;
    toggleAudio: () => void;
    toggleVideo: () => void;
    endCall: () => void;
}

export function useWebRTC({ meetingToken, userType }: UseWebRTCOptions): UseWebRTCReturn {
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const remoteVideoRef = useRef<HTMLVideoElement>(null!);
    const localVideoRef = useRef<HTMLVideoElement>(null!);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const lastSignalId = useRef(0);
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const sendSignal = useCallback(async (type: string, payload: any) => {
        await fetch("/api/agenda/signaling", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meetingToken, type, payload, sender: userType }),
        });
    }, [meetingToken, userType]);

    const handleSignal = useCallback(async (signal: any) => {
        const pc = peerConnection.current;
        if (!pc) return;

        if (signal.type === "offer" && userType === "client") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal("answer", answer);
        } else if (signal.type === "answer" && userType === "host") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        } else if (signal.type === "ice-candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
        }
    }, [userType, sendSignal]);

    const startPolling = useCallback(() => {
        pollingInterval.current = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/agenda/signaling?token=${meetingToken}&afterId=${lastSignalId.current}`
                );
                const signals = await res.json();

                for (const signal of signals) {
                    if (signal.id > lastSignalId.current) {
                        lastSignalId.current = signal.id;
                        if (signal.sender !== userType) {
                            await handleSignal(signal);
                        }
                    }
                }
            } catch {
                // Polling error — silently retry
            }
        }, 1000);
    }, [meetingToken, userType, handleSignal]);

    // Initialize WebRTC
    useEffect(() => {
        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                streamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });

                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                pc.ontrack = (event) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        await sendSignal("ice-candidate", event.candidate);
                    }
                };

                pc.onconnectionstatechange = () => {
                    if (pc.connectionState === "connected") setStatus("connected");
                    if (pc.connectionState === "disconnected") setStatus("disconnected");
                    if (pc.connectionState === "failed") setStatus("error");
                };

                peerConnection.current = pc;
                startPolling();

                if (userType === "host") {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await sendSignal("offer", offer);
                }
            } catch {
                setStatus("error");
            }
        };

        init();

        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            peerConnection.current?.close();
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [meetingToken, userType, sendSignal, startPolling]);

    const toggleAudio = useCallback(() => {
        const stream = streamRef.current;
        if (!stream) return;
        stream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsAudioMuted((prev) => !prev);
    }, []);

    const toggleVideo = useCallback(() => {
        const stream = streamRef.current;
        if (!stream) return;
        stream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsVideoOff((prev) => !prev);
    }, []);

    const endCall = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        peerConnection.current?.close();
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        setStatus("disconnected");
        window.location.href = "/agenda";
    }, []);

    return {
        status,
        localVideoRef,
        remoteVideoRef,
        isAudioMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo,
        endCall,
    };
}
