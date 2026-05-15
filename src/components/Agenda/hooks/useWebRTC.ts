"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface RealtimePayload {
    payload: any;
    [key: string]: any;
}

interface UseWebRTCProps {
    meetingToken: string;
    userType: "host" | "client";
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

const CONNECTION_TIMEOUT_MS = 45000;
const ICE_RESTART_MAX_ATTEMPTS = 2;

export const useWebRTC = ({ meetingToken, userType }: UseWebRTCProps) => {
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [mediaError, setMediaError] = useState<{ name: string; message: string } | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteStream = useRef<MediaStream>(new MediaStream());
    const channelRef = useRef<any>(null);
    const iceRestartCount = useRef(0);
    const negotiatingRef = useRef(false);
    const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
    };

    const setupMedia = useCallback(async () => {
        try {
            setStatus("connecting");
            setMediaError(null);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                    facingMode: "user",
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error: any) {
            console.error("Error accessing media devices:", error);
            setStatus("error");
            setMediaError({ name: error.name, message: error.message });
            return null;
        }
    }, []);

    const clearConnectionTimeout = () => {
        if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
        }
    };

    const startConnectionTimeout = () => {
        clearConnectionTimeout();
        connectionTimeoutRef.current = setTimeout(() => {
            if (peerConnection.current && peerConnection.current.connectionState !== "connected") {
                console.warn("[WebRTC] Connection timeout");
                setStatus("error");
            }
        }, CONNECTION_TIMEOUT_MS);
    };

    const setCodecPreferences = useCallback((pc: RTCPeerConnection) => {
        try {
            const transceivers = pc.getTransceivers?.() || [];
            for (const t of transceivers) {
                if (t.setCodecPreferences && t.receiver && t.receiver.getCapabilities?.()) {
                    const caps = RTCRtpReceiver.getCapabilities(t.kind);
                    if (!caps) continue;

                    let preferred: RTCRtpCodecCapability[] = [];
                    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

                    if (isSafari) {
                        preferred = caps.codecs.filter(
                            (c) => c.mimeType === "video/H264" || c.mimeType === "audio/opus"
                        );
                    } else {
                        preferred = caps.codecs.filter(
                            (c) => c.mimeType === "video/VP8" || c.mimeType === "video/VP9" || c.mimeType === "audio/opus"
                        );
                    }

                    if (preferred.length > 0) {
                        t.setCodecPreferences(preferred);
                    }
                }
            }
        } catch (e) {
            console.warn("[WebRTC] Could not set codec preferences:", e);
        }
    }, []);

    const attemptIceRestart = useCallback(async () => {
        if (!peerConnection.current || iceRestartCount.current >= ICE_RESTART_MAX_ATTEMPTS) return;
        iceRestartCount.current++;

        console.log(`[WebRTC] ICE restart attempt ${iceRestartCount.current}`);

        try {
            const offer = await peerConnection.current.createOffer({ iceRestart: true });
            await peerConnection.current.setLocalDescription(offer);
            if (channelRef.current?.send) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "offer",
                    payload: { offer, from: userType },
                });
            }
        } catch (e) {
            console.error("[WebRTC] ICE restart failed:", e);
        }
    }, [userType]);

    const fetchTurnCredentials = useCallback(async (): Promise<RTCIceServer[]> => {
        try {
            const res = await fetch("/api/agenda/turn-credentials");
            const data = await res.json();
            return data.iceServers || [];
        } catch {
            return [];
        }
    }, []);

    const startCall = useCallback(async () => {
        if (!peerConnection.current) return;
        try {
            if (peerConnection.current.signalingState === "stable") {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
            }
            const desc = peerConnection.current.localDescription;
            if (desc && channelRef.current?.send) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "offer",
                    payload: { offer: desc, from: userType },
                });
            }
        } catch (e) {
            console.error("[WebRTC] Error creating offer:", e);
        }
    }, [userType]);

    const createPeerConnection = useCallback((stream: MediaStream, iceServers?: RTCIceServer[]) => {
        iceRestartCount.current = 0;
        const pc = new RTCPeerConnection(iceServers ? { ...configuration, iceServers } : configuration);

        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
            if (event.streams[0]) {
                event.streams[0].getTracks().forEach((track) => {
                    remoteStream.current.addTrack(track);
                });
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream.current;
            }
            setStatus("connected");
            clearConnectionTimeout();
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && channelRef.current?.send) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "candidate",
                    payload: { candidate: event.candidate, from: userType },
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("[WebRTC] ICE state:", pc.iceConnectionState);
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
                attemptIceRestart();
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("[WebRTC] Connection state:", pc.connectionState);
            if (pc.connectionState === "connected") {
                setStatus("connected");
                clearConnectionTimeout();
            }
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                attemptIceRestart();
            }
        };

        pc.onnegotiationneeded = async () => {
            if (negotiatingRef.current) return;
            negotiatingRef.current = true;
            console.log("[WebRTC] Negotiation needed");
            try {
                if (userType === "host") {
                    await startCall();
                }
            } catch (e) {
                console.error("[WebRTC] Negotiation failed:", e);
            } finally {
                negotiatingRef.current = false;
            }
        };

        pc.onsignalingstatechange = () => {
            console.log("[WebRTC] Signaling state:", pc.signalingState);
            if (pc.signalingState === "closed") {
                setStatus("idle");
            }
        };

        peerConnection.current = pc;
        setCodecPreferences(pc);
        startConnectionTimeout();
        return pc;
    }, [userType, attemptIceRestart, setCodecPreferences, startCall]);

    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current || !localStream.current) return;
        try {
            if (peerConnection.current.signalingState !== "stable") {
                await peerConnection.current.setLocalDescription({ type: "rollback" });
            }
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            if (channelRef.current?.send) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "answer",
                    payload: { answer, from: userType },
                });
            }
        } catch (e) {
            console.error("[WebRTC] Error handling offer:", e);
        }
    }, [userType]);

    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current) return;
        try {
            if (peerConnection.current.signalingState === "have-local-offer") {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (e) {
            console.error("[WebRTC] Error handling answer:", e);
        }
    }, []);

    const handleCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (!peerConnection.current) return;
        if (!peerConnection.current.remoteDescription) {
            console.warn("[WebRTC] Skipping ICE candidate: no remote description yet");
            return;
        }
        try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error("[WebRTC] Error adding ice candidate:", e);
        }
    }, []);

    useEffect(() => {
        let active = true;
        let pollInterval: any;

        const init = async () => {
            const stream = await setupMedia();
            if (!stream || !active) return;

            const iceServers = await fetchTurnCredentials();
            if (iceServers.length > 0) {
                console.log("[WebRTC] Using TURN credentials:", iceServers.length, "servers");
            }
            createPeerConnection(stream, iceServers);

            const supabaseUrl = supabase ? (supabase as any).supabaseUrl || (supabase as any).options?.url : null;
            if (supabase && supabaseUrl && !String(supabaseUrl).includes("your-project")) {
                const channel = supabase.channel(meetingToken, {
                    config: { broadcast: { self: false } },
                });

                channelRef.current = channel;

                channel
                    .on("broadcast", { event: "offer" }, ({ payload }: RealtimePayload) => {
                        if (payload.from !== userType) handleOffer(payload.offer);
                    })
                    .on("broadcast", { event: "answer" }, ({ payload }: RealtimePayload) => {
                        if (payload.from !== userType) handleAnswer(payload.answer);
                    })
                    .on("broadcast", { event: "candidate" }, ({ payload }: RealtimePayload) => {
                        if (payload.from !== userType) handleCandidate(payload.candidate);
                    })
                    .on("broadcast", { event: "user-joined" }, ({ payload }: RealtimePayload) => {
                        console.log("[WebRTC] Remote user joined");
                        if (payload.from !== userType && userType === "host") {
                            startCall();
                        }
                    })
                    .subscribe(async (status: string) => {
                        if (status === "SUBSCRIBED") {
                            channel.send({
                                type: "broadcast",
                                event: "user-joined",
                                payload: { from: userType },
                            });
                        }
                    });
            } else {
                console.log("[WebRTC] Supabase not configured, using Polling fallback...");
                let lastId = 0;

                const signalingFetch = (body: any) => {
                    fetch("/api/agenda/signaling", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    }).catch((e) => console.warn("[Signaling] fetch error:", e));
                };

                channelRef.current = {
                    send: (data: any) => {
                        signalingFetch({
                            meetingToken,
                            type: data.event,
                            payload: data.payload[data.event] || data.payload,
                            sender: userType,
                        });
                    }
                };

                const poll = async () => {
                    try {
                        const res = await fetch(`/api/agenda/signaling?token=${meetingToken}&afterId=${lastId}`);
                        if (!res.ok) {
                            console.warn("[Polling] API responded with", res.status);
                            return;
                        }
                        const messages = await res.json();
                        if (!Array.isArray(messages)) {
                            console.warn("[Polling] Unexpected response format");
                            return;
                        }

                        for (const msg of messages) {
                            lastId = Math.max(lastId, msg.id);
                            if (msg.sender === userType) continue;

                            if (msg.type === "offer") await handleOffer(msg.payload);
                            if (msg.type === "answer") await handleAnswer(msg.payload);
                            if (msg.type === "candidate") await handleCandidate(msg.payload);
                        }
                    } catch (e) {
                        console.error("[Polling] error:", e);
                    }
                };

                fetch("/api/agenda/signaling", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ meetingToken, type: "user-joined", payload: {}, sender: userType }),
                }).catch((e) => console.warn("[Signaling] join error:", e));

                pollInterval = setInterval(poll, 3000);
            }
        };

        init();

        return () => {
            active = false;
            clearConnectionTimeout();
            localStream.current?.getTracks().forEach(track => track.stop());
            remoteStream.current.getTracks().forEach(track => track.stop());
            remoteStream.current = new MediaStream();
            peerConnection.current?.close();
            if (supabase && channelRef.current && channelRef.current.unsubscribe) {
                supabase.removeChannel(channelRef.current);
            }
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [meetingToken, userType, setupMedia, createPeerConnection, handleOffer, handleAnswer, handleCandidate, startCall, fetchTurnCredentials]);

    const toggleAudio = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        localStream.current?.getTracks().forEach(track => track.stop());
        peerConnection.current?.close();
    };

    return {
        status,
        localVideoRef,
        remoteVideoRef,
        isAudioMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo,
        endCall,
        mediaError,
        retryMedia: setupMedia,
    };
};
