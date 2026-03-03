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
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

    const sendSignal = useCallback(async (type: string, payload: any) => {
        try {
            await fetch("/api/agenda/signaling", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingToken, type, payload, sender: userType }),
                cache: "no-store",
            });
        } catch (err) {
            console.error("Error sending signal:", err);
        }
    }, [meetingToken, userType]);

    const handleSignal = useCallback(async (signal: any) => {
        const pc = peerConnection.current;
        if (!pc) return;

        console.log(`Handling signal: ${signal.type} from ${signal.sender}`);

        try {
            if (signal.type === "offer" && userType === "client") {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await sendSignal("answer", answer);

                // Process queued candidates
                while (iceCandidateQueue.current.length > 0) {
                    const candidate = iceCandidateQueue.current.shift();
                    if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } else if (signal.type === "answer" && userType === "host") {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                // Process queued candidates
                while (iceCandidateQueue.current.length > 0) {
                    const candidate = iceCandidateQueue.current.shift();
                    if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } else if (signal.type === "ice-candidate") {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
                } else {
                    iceCandidateQueue.current.push(signal.payload);
                }
            }
        } catch (err) {
            console.error("Error handling signal:", signal.type, err);
            throw err; // Re-throw to prevent polling from marking as read if critical
        }
    }, [userType, sendSignal]);

    const startPolling = useCallback(() => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        pollingInterval.current = setInterval(async () => {
            try {
                const res = await fetch(
                    `/api/agenda/signaling?token=${meetingToken}&afterId=${lastSignalId.current}`,
                    { cache: "no-store" }
                );
                if (!res.ok) return;
                const signals = await res.json();

                for (const signal of signals) {
                    if (signal.id > lastSignalId.current) {
                        if (signal.sender !== userType) {
                            try {
                                await handleSignal(signal);
                                lastSignalId.current = signal.id; // Only update if handled
                            } catch (e) {
                                console.warn("Failed to process signal, will retry:", signal.id);
                                // If it fails, we don't update lastSignalId, but this might cause infinite loop
                                // if the signal is permanently broken. Better to skip after some retries or
                                // handle ICE errors gracefully.
                                // For now, let's at least ensure we don't skip ICE candidates that could be queued.
                                // lastSignalId.current = signal.id; // Original behavior, now changed
                            }
                        } else {
                            lastSignalId.current = signal.id;
                        }
                    }
                }
            } catch (err) {
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
                    iceServers: [
                        { urls: "stun:stun.l.google.com:19302" },
                        { urls: "stun:stun1.l.google.com:19302" },
                        { urls: "stun:stun2.l.google.com:19302" },
                        { urls: "stun:stun3.l.google.com:19302" },
                        { urls: "stun:stun4.l.google.com:19302" },
                    ],
                });

                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                pc.ontrack = (event) => {
                    console.log("Track received:", event.track.kind);
                    if (remoteVideoRef.current) {
                        if (event.streams && event.streams[0]) {
                            remoteVideoRef.current.srcObject = event.streams[0];
                        } else {
                            // Fallback if event.streams is empty
                            let inboundStream = remoteVideoRef.current.srcObject as MediaStream;
                            if (!inboundStream || !(inboundStream instanceof MediaStream)) {
                                inboundStream = new MediaStream();
                                remoteVideoRef.current.srcObject = inboundStream;
                            }
                            inboundStream.addTrack(event.track);
                        }
                    }
                };

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        await sendSignal("ice-candidate", event.candidate);
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log("Connection state:", pc.connectionState);
                    if (pc.connectionState === "connected") setStatus("connected");
                    if (pc.connectionState === "disconnected") setStatus("disconnected");
                    if (pc.connectionState === "failed") {
                        setStatus("error");
                        console.error("WebRTC connection failed. Check NAT/Firewall.");
                    }
                };

                peerConnection.current = pc;
                startPolling();

                if (userType === "host") {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await sendSignal("offer", offer);
                }
            } catch (err) {
                console.error("WebRTC Initialization failed:", err);
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
