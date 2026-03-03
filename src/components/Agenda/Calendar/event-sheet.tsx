"use client";

import { format } from "date-fns";
import {
    Pen,
    FileText,
    Layers,
    Trash2,
    X,
    Bell,
    Calendar as CalendarIcon,
    Users,
} from "lucide-react";
import { Button } from "../ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "../ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import type { Event } from "../../../types/agenda";
import { useState } from "react";
import { CreateEventDialog } from "./create-event-dialog";
import { useAgendaCache } from "../../../hooks/useAgendaCache";
import { toast } from "react-toastify";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useCalendarStore } from "../store/calendar-store";
import { EventParticipants } from "./event-participants";
import { EventMeetingSection } from "./event-meeting-section";

interface EventSheetProps {
    event: Event | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatTime(time: string): string {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return format(date, "EEEE, MMMM dd");
}

export function EventSheet({ event, open, onOpenChange }: EventSheetProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { invalidateCache } = useAgendaCache();
    const { applyFilters } = useCalendarStore();
    const [duplicateDate, setDuplicateDate] = useState<Date | undefined>(undefined);
    const [duplicateOpen, setDuplicateOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    if (!event) return null;

    const triggerRefresh = () => {
        invalidateCache();
        applyFilters({});
    };

    const executeDelete = async () => {
        try {
            const res = await fetch(`/api/agenda/${event.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Cita eliminada correctamente");
                setDeleteDialogOpen(false);
                onOpenChange(false);
                triggerRefresh();
            } else {
                toast.error("Error al eliminar la cita");
            }
        } catch (error) {
            toast.error("Error al eliminar la cita");
            setDeleteDialogOpen(false);
        }
    };

    const handleDuplicate = async () => {
        if (!duplicateDate) {
            toast.error("Selecciona una fecha para duplicar");
            return;
        }

        try {
            const payload = {
                title: event.title,
                date: format(duplicateDate, "yyyy-MM-dd"),
                startTime: event.startTime,
                endTime: event.endTime,
                participants: event.participants,
                meetingLink: event.meetingLink,
                timezone: event.timezone,
            };

            const res = await fetch('/api/agenda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Cita duplicada correctamente");
                setDuplicateOpen(false);
                onOpenChange(false);
                triggerRefresh();
            } else {
                toast.error("Error al duplicar la cita");
            }
        } catch {
            toast.error("Error al duplicar la cita");
        }
    };

    const dateStr = formatDate(event.date);
    const startTimeStr = formatTime(event.startTime);
    const endTimeStr = formatTime(event.endTime);
    const timezone = event.timezone || "America/Bogota";

    const organizer = event.participants[0] || "user1";
    const otherParticipants = event.participants.slice(1);

    const mockParticipants = [
        {
            id: organizer,
            name: organizer,
            email: organizer,
            isOrganizer: true,
            rsvp: "yes" as const,
            isYou: false,
        },
        ...otherParticipants.slice(0, 3).map((p) => ({
            id: p,
            name: p,
            email: p,
            isOrganizer: false,
            rsvp: "yes" as const,
            isYou: false,
        })),
    ];

    const yesCount = mockParticipants.filter((p) => p.rsvp === "yes").length;

    return (
        <>
            <CreateEventDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                eventToEdit={event}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar Cita</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={executeDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-[560px] overflow-y-auto p-0 border-l border-r border-t [&>button]:hidden"
                >
                    <div className="flex flex-col h-full">
                        <SheetHeader className="px-4 pt-4 pb-4 border-b border-border">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 hover:bg-muted"
                                        onClick={() => setEditDialogOpen(true)}
                                    >
                                        <Pen className="size-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                                        <FileText className="size-4 text-muted-foreground" />
                                    </Button>

                                    <Popover open={duplicateOpen} onOpenChange={setDuplicateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
                                                <Layers className="size-4 text-muted-foreground" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <div className="p-3">
                                                <div className="mb-2 font-medium text-sm">Duplicar cita para:</div>
                                                <Calendar
                                                    mode="single"
                                                    selected={duplicateDate}
                                                    onSelect={setDuplicateDate}
                                                    initialFocus
                                                />
                                                <div className="mt-3 flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setDuplicateOpen(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button size="sm" onClick={handleDuplicate} disabled={!duplicateDate}>
                                                        Duplicar
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 hover:bg-muted"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="size-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon" className="size-6 rounded-full bg-muted hover:bg-muted">
                                        <X className="size-4 text-muted-foreground" />
                                    </Button>
                                </SheetClose>
                            </div>

                            <div className="flex flex-col gap-1 mb-4">
                                <SheetTitle className="text-xl font-semibold text-foreground leading-normal">
                                    {event.title}
                                </SheetTitle>
                                <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                                    <span>{dateStr}</span>
                                    <span className="size-1 rounded-full bg-muted-foreground" />
                                    <span>{startTimeStr} - {endTimeStr}</span>
                                    <span className="size-1 rounded-full bg-muted-foreground" />
                                    <span>{timezone}</span>
                                </div>
                            </div>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            <div className="flex flex-col gap-4 max-w-[512px] mx-auto">
                                <EventParticipants participants={mockParticipants} />

                                {event.meetingLink && (
                                    <EventMeetingSection meetingLink={event.meetingLink} />
                                )}

                                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="p-1"><Bell className="size-4" /></div>
                                        <span>Reminder: 30min before</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="p-1"><CalendarIcon className="size-4" /></div>
                                        <span>Organizer: {organizer}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="p-1"><Users className="size-4" /></div>
                                        <span>
                                            {mockParticipants.length} persons
                                            <span className="mx-1">•</span>
                                            {yesCount} yes
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <p className="text-xs text-muted-foreground leading-[1.6]">
                                        During today&apos;s daily check-in, we had an in-depth
                                        discussion about the MVP (Minimum Viable Product). We agreed
                                        on the core features that need to be included, focusing on the
                                        AI-conducted interviews and the memoir compilation
                                        functionality.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
