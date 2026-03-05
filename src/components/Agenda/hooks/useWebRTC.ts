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
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const remoteVideoRef = useRef<HTMLVideoElement>(null!);
    const localVideoRef = useRef<HTMLVideoElement>(null!);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const lastSignalId = useRef(0);
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
    const hasInitiatedConnection = useRef(false);
    const waitingForOffer = useRef(userType === "client");

    const sendSignal = useCallback(async (type: string, payload: any) => {
        try {
            const response = await fetch("/api/agenda/signaling", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingToken, type, payload, sender: userType }),
                cache: "no-store",
            });
            const result = await response.json();
            console.log(`[Signaling] Sent ${type} to ${userType}, result:`, result);
            return result;
        } catch (err) {
            console.error("[Signaling] Error sending signal:", err);
        }
    }, [meetingToken, userType]);

    const handleSignal = useCallback(async (signal: any) => {
        const pc = peerConnection.current;
        if (!pc) {
            console.error("[Signaling] No peer connection available");
            return;
        }

        console.log(`[Signaling] Handling ${signal.type} from ${signal.sender}`);

        try {
            if (signal.type === "offer" && userType === "client") {
                console.log("[Signaling] Processing offer from host");
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                waitingForOffer.current = false;

                console.log("[Signaling] Sending answer to host");
                await sendSignal("answer", answer);
            }
            else if (signal.type === "answer" && userType === "host") {
                console.log("[Signaling] Processing answer from client");
                await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            }
            else if (signal.type === "ice-candidate") {
                console.log("[Signaling] Processing ICE candidate from", signal.sender);
                if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
                } else {
                    iceCandidateQueue.current.push(signal.payload);
                    console.log("[Signaling] Queued ICE candidate, queue length:", iceCandidateQueue.current.length);
                }
            }
            else if (signal.type === "client-ready" && userType === "host") {
                console.log("[Signaling] Client is ready, initiating connection");
                if (!hasInitiatedConnection.current) {
                    hasInitiatedConnection.current = true;
                    await initiateConnection(pc);
                }
            }
        } catch (err) {
            console.error("[Signaling] Error handling signal:", signal.type, err);
            throw err;
        }
    }, [userType, sendSignal]);

    const initiateConnection = async (pc: RTCPeerConnection) => {
        if (userType !== "host") return;

        try {
            console.log("[WebRTC] Creating and sending offer");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal("offer", offer);
        } catch (err) {
            console.error("[WebRTC] Error creating offer:", err);
        }
    };

    const processIceCandidateQueue = async (pc: RTCPeerConnection) => {
        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            if (candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("[Signaling] Processed queued ICE candidate");
                } catch (err) {
                    console.error("[Signaling] Error adding queued ICE candidate:", err);
                }
            }
        }
    };

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
                            console.log(`[Polling] Received ${signal.type} from ${signal.sender}, id: ${signal.id}`);
                            try {
                                await handleSignal(signal);
                                lastSignalId.current = signal.id;
                            } catch (e) {
                                console.warn("[Polling] Failed to process signal:", signal.id, e);
                            }
                        } else {
                            lastSignalId.current = signal.id;
                        }
                    }
                }
            } catch (err) {
                console.warn("[Polling] Error:", err);
            }
        }, 1000);
    }, [meetingToken, userType, handleSignal]);

    useEffect(() => {
        const init = async () => {
            try {
                console.log("[WebRTC] Initializing as", userType);

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: true
                });
                console.log("[WebRTC] Got local media stream");
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
                    console.log("[WebRTC] Track received:", event.track.kind);
                    if (remoteVideoRef.current) {
                        if (event.streams && event.streams[0]) {
                            remoteVideoRef.current.srcObject = event.streams[0];
                            console.log("[WebRTC] Set remote stream from event.streams");
                        } else {
                            let inboundStream = remoteVideoRef.current.srcObject as MediaStream;
                            if (!inboundStream || !(inboundStream instanceof MediaStream)) {
                                inboundStream = new MediaStream();
                                remoteVideoRef.current.srcObject = inboundStream;
                            }
                            inboundStream.addTrack(event.track);
                            console.log("[WebRTC] Added track to fallback stream");
                        }
                    }
                };

                pc.onicecandidate = async (event) => {
                    if (event.candidate) {
                        console.log("[WebRTC] ICE candidate generated");
                        await sendSignal("ice-candidate", event.candidate);
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    console.log("[WebRTC] ICE Connection state:", pc.iceConnectionState);
                    if (pc.iceConnectionState === "connected" || pc.connectionState === "connected") {
                        setStatus("connected");
                        console.log("[WebRTC] Connected!");
                    }
                    if (pc.iceConnectionState === "disconnected") setStatus("disconnected");
                    if (pc.iceConnectionState === "failed") {
                        setStatus("error");
                        console.error("[WebRTC] ICE connection failed. Check NAT/Firewall.");
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log("[WebRTC] Connection state:", pc.connectionState);
                    if (pc.connectionState === "connected") {
                        setStatus("connected");
                        console.log("[WebRTC] Connected via onconnectionstatechange!");
                    }
                    if (pc.connectionState === "disconnected") setStatus("disconnected");
                    if (pc.connectionState === "failed") {
                        setStatus("error");
                        console.error("[WebRTC] Connection failed. Check NAT/Firewall.");
                    }
                };

                peerConnection.current = pc;

                startPolling();

                if (userType === "client") {
                    console.log("[WebRTC] Client ready, notifying host");
                    await sendSignal("client-ready", { timestamp: Date.now() });
                }

            } catch (err) {
                console.error("[WebRTC] Initialization failed:", err);
                setStatus("error");
            }
        };

        init();

        return () => {
            console.log("[WebRTC] Cleaning up connection");
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
            if (peerConnection.current) {
                peerConnection.current.onicecandidate = null;
                peerConnection.current.ontrack = null;
                peerConnection.current.onconnectionstatechange = null;
                peerConnection.current.oniceconnectionstatechange = null;
                peerConnection.current.close();
                peerConnection.current = null;
            }
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
            }
            iceCandidateQueue.current = [];
            hasInitiatedConnection.current = false;
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

    const endCall = useCallback(async () => {
        console.log("[WebRTC] Ending call...");
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
        }

        setStatus("disconnected");

        // Inform server to clean this token's signaling data, so if they rejoin
        // it starts a fresh P2P connection sequence.
        try {
            await fetch("/api/agenda/signaling", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meetingToken }),
            });
        } catch (err) {
            console.error("[WebRTC] Failed to clear DB signaling room", err);
        }

        window.location.href = "/agenda";
    }, [meetingToken]);

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
