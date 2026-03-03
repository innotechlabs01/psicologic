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
                    Meeting
                </p>
            </div>
            <div className="flex gap-2">
                <Button
                    className="flex-1 h-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium gap-2 shadow-sm"
                    onClick={() => window.open(meetingLink, "_blank")}
                >
                    <span>Join meeting</span>
                    <div className="flex gap-0.5">
                        <Kbd className="bg-white/14 text-white text-[10.8px] px-1.5 py-1 rounded">
                            ⌘
                        </Kbd>
                        <Kbd className="bg-white/14 text-white text-[10.8px] px-1.5 py-1 rounded w-[18px]">
                            J
                        </Kbd>
                    </div>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs border-border"
                    onClick={() => copyToClipboard(meetingLink)}
                >
                    <LinkIcon className="size-4" />
                    <span>Copy link</span>
                </Button>
            </div>
        </div>
    );
}
