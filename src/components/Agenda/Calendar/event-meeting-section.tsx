"use client";

import { Link as LinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

interface EventMeetingSectionProps {
    meetingLink: string;
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
}

export function EventMeetingSection({ meetingLink }: EventMeetingSectionProps) {
    const isInternal = meetingLink.includes(window.location.hostname) || meetingLink.startsWith("/");

    const handleJoin = () => {
        if (isInternal) {
            const url = meetingLink.startsWith("/")
                ? `${window.location.origin}${meetingLink}`
                : meetingLink;
            const meetingUrl = new URL(url);
            meetingUrl.searchParams.set("userType", "host");
            window.location.href = meetingUrl.toString();
        } else {
            window.open(meetingLink, "_blank");
        }
    };

    return (
        <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
                <div className="size-6 shrink-0">
                    <svg
                        viewBox="0 0 24 24"
                        className="size-full"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
                            fill="#22C55E"
                        />
                    </svg>
                </div>
                <p className="text-xs font-medium text-muted-foreground flex-1">
                    {isInternal ? "Consulta por Video (Interno)" : "Reunión Externa"}
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    className="flex-1 h-8 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium gap-2 shadow-sm transition-all duration-300"
                    onClick={handleJoin}
                >
                    <span>{isInternal ? "Iniciar Consulta" : "Unirse a Reunión"}</span>
                    <div className="flex gap-0.5 opacity-60">
                        <Kbd className="bg-white/20 text-white text-[10px] px-1 py-0.5 rounded">
                            ⌘
                        </Kbd>
                        <Kbd className="bg-white/20 text-white text-[10px] px-1 py-0.5 rounded">
                            J
                        </Kbd>
                    </div>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs border-border hover:bg-muted"
                    onClick={() => copyToClipboard(meetingLink)}
                >
                    <LinkIcon className="size-4 text-muted-foreground" />
                    <span>Enlace</span>
                </Button>
            </div>
        </div>
    );
}
