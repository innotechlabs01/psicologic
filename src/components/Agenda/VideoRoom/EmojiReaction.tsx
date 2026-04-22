"use client";

import React, { useEffect, useState } from "react";

export interface EmojiReactionItem {
    id: string;
    emoji: string;
    x: number; // percentage 0-100
    fromSelf: boolean;
}

interface EmojiReactionProps {
    reactions: EmojiReactionItem[];
}

const EmojiReaction: React.FC<EmojiReactionProps> = ({ reactions }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {reactions.map((reaction) => (
                <FloatingEmoji key={reaction.id} reaction={reaction} />
            ))}
        </div>
    );
};

const FloatingEmoji: React.FC<{ reaction: EmojiReactionItem }> = ({ reaction }) => {
    const [phase, setPhase] = useState<"enter" | "float" | "exit">("enter");

    useEffect(() => {
        const t1 = setTimeout(() => setPhase("float"), 50);
        const t2 = setTimeout(() => setPhase("exit"), 2400);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    const style: React.CSSProperties = {
        left: `${reaction.x}%`,
        bottom: "80px",
        transform: phase === "enter"
            ? "translateY(0px) scale(0.3)"
            : phase === "float"
                ? "translateY(-120px) scale(1)"
                : "translateY(-200px) scale(0.6)",
        opacity: phase === "enter" ? 0 : phase === "float" ? 1 : 0,
        transition: phase === "enter"
            ? "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : phase === "float"
                ? "all 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                : "all 0.4s ease-in",
        filter: phase === "float" ? "drop-shadow(0 0 8px rgba(99,102,241,0.6))" : "none",
    };

    return (
        <div className="absolute text-4xl select-none" style={style}>
            {/* Burst ring */}
            {phase === "float" && (
                <span
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                        animation: "burst 0.4s ease-out forwards",
                    }}
                >
                    <span
                        className="block rounded-full border-2 border-indigo-400/60"
                        style={{
                            width: "60px",
                            height: "60px",
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            animation: "burstRing 0.5s ease-out forwards",
                        }}
                    />
                </span>
            )}
            {reaction.emoji}
        </div>
    );
};

export default EmojiReaction;