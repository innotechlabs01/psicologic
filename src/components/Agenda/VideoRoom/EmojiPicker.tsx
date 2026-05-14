"use client";

import React, { useEffect, useRef } from "react";
import { Smile } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "👏", "🔥", "😮", "🎉", "🙏", "💯", "✨"];

interface EmojiPickerProps {
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onToggle, onSelect }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                if (isOpen) onToggle();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen, onToggle]);

    return (
        <div ref={ref} className="relative">
            {/* Picker panel */}
            {isOpen && (
                <div
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50"
                    style={{
                        animation: "slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                    }}
                >
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/50">
                        <div className="grid grid-cols-5 gap-2">
                            {EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        onSelect(emoji);
                                        onToggle();
                                    }}
                                    className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-all duration-100 hover:scale-125"
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center mt-1">
                        <div className="w-3 h-3 bg-zinc-900/95 border-r border-b border-white/10 rotate-45 -mt-2" />
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <ControlButton
                onClick={onToggle}
                active={isOpen}
                title="Reacciones"
                activeClass="bg-indigo-600/40 text-indigo-300 border-indigo-500/40"
            >
                <Smile className="size-5" />
            </ControlButton>
        </div>
    );
};

// Shared control button used inside this file and exported for VideoRoom
export const ControlButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    title?: string;
    activeClass?: string;
    children: React.ReactNode;
    size?: "md" | "lg";
}> = ({ onClick, active, danger, title, activeClass, children, size = "md" }) => {
    const base =
        "relative flex items-center justify-center rounded-full border transition-all duration-200 select-none cursor-pointer group";
    const sizeClass = size === "lg" ? "w-16 h-16" : "w-12 h-12";
    const colorClass = danger
        ? "bg-red-600 hover:bg-red-500 border-red-500/50 text-white active:scale-90 shadow-lg shadow-red-900/40"
        : active
            ? activeClass || "bg-white/15 border-white/20 text-white"
            : "bg-white/8 border-white/10 text-zinc-300 hover:bg-white/15 hover:text-white active:scale-90 backdrop-blur-sm";

    return (
        <button className={`${base} ${sizeClass} ${colorClass}`} onClick={onClick} title={title}>
            {children}
        </button>
    );
};

export default EmojiPicker;