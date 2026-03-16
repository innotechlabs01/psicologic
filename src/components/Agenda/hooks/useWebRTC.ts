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

export const useWebRTC = ({ meetingToken, userType }: UseWebRTCProps) => {
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const channelRef = useRef<any>(null);

    const configuration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ],
    };

    const setupMedia = useCallback(async () => {
        try {
            setStatus("connecting");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            setStatus("error");
            return null;
        }
    }, []);

    const createPeerConnection = useCallback((stream: MediaStream) => {
        const pc = new RTCPeerConnection(configuration);

        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            setStatus("connected");
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "candidate",
                    payload: { candidate: event.candidate, from: userType },
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("Connection state changed:", pc.connectionState);
            if (pc.connectionState === "connected") setStatus("connected");
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                setStatus("idle");
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [userType]);

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current || !localStream.current) return;
        
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        channelRef.current.send({
            type: "broadcast",
            event: "answer",
            payload: { answer, from: userType },
        });
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleCandidate = async (candidate: RTCIceCandidateInit) => {
        if (!peerConnection.current) return;
        try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error("Error adding received ice candidate", e);
        }
    };

    const startCall = useCallback(async () => {
        if (!peerConnection.current || !channelRef.current) return;
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        // Send offer via whatever channel is active
        if (channelRef.current.send) {
            channelRef.current.send({
                type: "broadcast",
                event: "offer",
                payload: { offer, from: userType },
            });
        } else {
            // REST fallback
            fetch("/api/agenda/signaling", {
                method: "POST",
                body: JSON.stringify({ meetingToken, type: "offer", payload: offer, sender: userType }),
            });
        }
    }, [meetingToken, userType]);

    useEffect(() => {
        let active = true;
        let pollInterval: any;

        const init = async () => {
            const stream = await setupMedia();
            if (!stream || !active) return;

            createPeerConnection(stream);

            // Signaling Choice A: Supabase (preferred)
            // check if supabase is effectively configured (real url)
            if (supabase && (supabase as any).supabaseUrl && !(supabase as any).supabaseUrl.includes("your-project")) {
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
                // Choice B: Polling Fallback (DB-based) using existing /api/agenda/signaling
                console.log("Supabase not configured or invalid, using Polling fallback...");
                let lastId = 0;
                
                // Track signaling for our ref so onicecandidate can use it
                channelRef.current = {
                    send: (data: any) => {
                        fetch("/api/agenda/signaling", {
                            method: "POST",
                            body: JSON.stringify({ 
                                meetingToken, 
                                type: data.event, 
                                payload: data.payload[data.event] || data.payload, 
                                sender: userType 
                            }),
                        });
                    }
                };

                const poll = async () => {
                    try {
                        const res = await fetch(`/api/agenda/signaling?token=${meetingToken}&afterId=${lastId}`);
                        const messages = await res.json();
                        
                        for (const msg of messages) {
                            lastId = Math.max(lastId, msg.id);
                            if (msg.sender === userType) continue;

                            if (msg.type === "offer") handleOffer(msg.payload);
                            if (msg.type === "answer") handleAnswer(msg.payload);
                            if (msg.type === "candidate") handleCandidate(msg.payload);
                            if (msg.type === "user-joined" && userType === "host") startCall();
                        }
                    } catch (e) {
                        console.error("Polling error:", e);
                    }
                };

                // Notify join
                fetch("/api/agenda/signaling", {
                    method: "POST",
                    body: JSON.stringify({ meetingToken, type: "user-joined", payload: {}, sender: userType }),
                });

                pollInterval = setInterval(poll, 3000);
            }
        };

        init();

        return () => {
            active = false;
            localStream.current?.getTracks().forEach(track => track.stop());
            peerConnection.current?.close();
            if (channelRef.current && channelRef.current.unsubscribe) {
                supabase.removeChannel(channelRef.current);
            }
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [meetingToken, userType, setupMedia, createPeerConnection, handleOffer, handleAnswer, handleCandidate, startCall]);

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
        window.location.href = "/agenda";
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
    };
};
