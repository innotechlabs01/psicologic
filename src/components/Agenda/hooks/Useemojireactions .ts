"use client";

import { useState, useCallback, useRef } from "react";
import type { EmojiReactionItem } from "../VideoRoom/EmojiReaction";


/**
 * Manages emoji reactions. To send reactions to the remote peer,
 * pass a `sendReactionFn` (e.g. via WebRTC DataChannel).
 * If no DataChannel is available yet, reactions are still shown locally.
 */
export function useEmojiReactions(sendReactionFn?: (emoji: string) => void) {
    const [reactions, setReactions] = useState<EmojiReactionItem[]>([]);
    const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const addReaction = useCallback((emoji: string, fromSelf: boolean) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const x = fromSelf
            ? 20 + Math.random() * 20  // left side for own reactions
            : 60 + Math.random() * 20; // right side for remote

        const item: EmojiReactionItem = { id, emoji, x, fromSelf };
        setReactions((prev) => [...prev, item]);

        const t = setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
            timeoutRefs.current.delete(id);
        }, 3000);
        timeoutRefs.current.set(id, t);
    }, []);

    const sendReaction = useCallback(
        (emoji: string) => {
            addReaction(emoji, true);
            sendReactionFn?.(emoji);
        },
        [addReaction, sendReactionFn]
    );

    /** Call this when a reaction arrives from the remote peer */
    const receiveReaction = useCallback(
        (emoji: string) => {
            addReaction(emoji, false);
        },
        [addReaction]
    );

    return { reactions, sendReaction, receiveReaction };
}