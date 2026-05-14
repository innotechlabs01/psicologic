"use client";

import React, { useEffect, useRef, useState } from "react";

interface AudioActivityIndicatorProps {
    stream: MediaStream | null;
    muted: boolean;
}

const AudioActivityIndicator: React.FC<AudioActivityIndicatorProps> = ({ stream, muted }) => {
    const [level, setLevel] = useState(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animRef = useRef<number | null>(null);
    const contextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!stream || muted) {
            setLevel(0);
            return;
        }

        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        contextRef.current = ctx;
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setLevel(Math.min(avg / 50, 1));
            animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            source.disconnect();
            ctx.close();
        };
    }, [stream, muted]);

    if (muted || level < 0.05) return null;

    return (
        <span
            className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
            style={{
                opacity: level,
                transform: `scale(${1 + level * 0.4})`,
                transition: "transform 0.05s linear, opacity 0.05s linear",
                boxShadow: `0 0 ${8 + level * 16}px rgba(52,211,153,0.6)`,
            }}
        />
    );
};

export default AudioActivityIndicator;