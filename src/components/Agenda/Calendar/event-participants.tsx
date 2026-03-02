"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarImage } from "../ui/avatar";

interface Participant {
    id: string;
    name: string;
    email: string;
    isOrganizer: boolean;
    rsvp: "yes" | "no" | "maybe";
    isYou: boolean;
}

interface EventParticipantsProps {
    participants: Participant[];
}

export function EventParticipants({ participants }: EventParticipantsProps) {
    const [rsvpStatus, setRsvpStatus] = useState<"yes" | "no" | "maybe" | null>(null);

    return (
        <div className="flex flex-col gap-4">
            {participants.map((participant) => (
                <div key={participant.id} className="flex items-start gap-3 relative">
                    <Avatar className="size-7 border-[1.4px] border-background shrink-0">
                        <AvatarImage
                            src={`https://api.dicebear.com/9.x/glass/svg?seed=${participant.id}`}
                        />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 relative">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 relative">
                                    <p className="text-[13px] font-medium text-foreground leading-[18px]">
                                        {participant.name}
                                    </p>
                                    {participant.isOrganizer && (
                                        <span className="text-[10px] font-medium text-cyan-500 px-0.5 py-0.5 rounded-full">
                                            Organizer
                                        </span>
                                    )}
                                    {participant.isYou && (
                                        <span className="text-[10px] font-medium text-foreground px-0.5 py-0.5 rounded-full">
                                            You
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-none">
                                    {participant.email}
                                </p>
                            </div>
                            <CheckCircle2 className="size-3 text-green-500 shrink-0 absolute right-0 top-[17px]" />
                        </div>
                        {participant.isYou && (
                            <div className="mt-3 flex gap-1.5 bg-muted/50 rounded-lg p-1.5">
                                {(["yes", "no", "maybe"] as const).map((status) => (
                                    <Button
                                        key={status}
                                        variant={rsvpStatus === status ? "default" : "ghost"}
                                        size="sm"
                                        className={`flex-1 h-[30px] text-xs font-medium ${rsvpStatus === status
                                            ? "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                                            : "text-muted-foreground"
                                            }`}
                                        onClick={() => setRsvpStatus(status)}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
