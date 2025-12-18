"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar } from "../ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";
import { useCalendarStore } from "../store/calendar-store";
import { cn } from "../../../lib/utils";
import { showToast } from "../../../utils/toast";
import { useAgendaCache } from '../../../hooks/useAgendaCache';
import type { Event } from "../mock-data/events";
import { getHoliday } from "./calendar-utils";

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({
    open,
    onOpenChange,
}: CreateEventDialogProps) {
    const { addEvent, goToDate } = useCalendarStore();
    const [title, setTitle] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [timezone, setTimezone] = useState("");
    const [participants, setParticipants] = useState("");
    // const [name, setName] = useState("");
    // const [email, setEmail] = useState("");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { addEventToCache } = useAgendaCache();

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        if (!title || !date || !startTime || !endTime) {
            showToast('Por favor completa título, fecha, horas y participantes.', 'error');
            return;
        }

        const holiday = getHoliday(date);
        if (holiday) {
            showToast(`Cannot schedule events on holidays: ${holiday}`, 'error');
            return;
        }

        const participantsList = participants
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

        const payload = {
            title,
            date: format(date, "yyyy-MM-dd"),
            startTime,
            endTime,
            participants: participantsList,
        } as any;

        setSubmitting(true);
        try {
            const res = await fetch('/api/agenda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data?.error || 'Error creando la cita';
                showToast(msg, 'error');
                setSubmitting(false);
                return;
            }

            // Server returns created event
            const created = data;

            if (!created || !created.id) {
                showToast('Error al crear la cita.', 'error');
                setSubmitting(false);
                return;
            }

            // Map to client Event shape if needed and add to store
            addEvent({
                title: created.title || title,
                date: created.date || format(date, 'yyyy-MM-dd'),
                startTime: created.startTime || startTime,
                endTime: created.endTime || endTime,
                participants: participantsList.length > 0 ? participantsList : [],
                meetingLink: created.meetingLink || meetingLink || undefined,
                timezone: created.timezone || timezone || undefined,
            });

            // Also update local cache (optimistic) so the calendar reflects the new item
            try {
                addEventToCache({
                    id: created.id,
                    title: created.title || title,
                    date: created.date || format(date, 'yyyy-MM-dd'),
                    startTime: created.startTime || startTime,
                    endTime: created.endTime || endTime,
                    participants: created.participants || participantsList,
                    meetingLink: created.meetingLink || meetingLink || undefined,
                    timezone: created.timezone || timezone || undefined,
                });
                console.debug('[CreateEventDialog] addEventToCache updated', created.id);
            } catch (err) {
                console.warn('Failed to update agenda cache', err);
            }
            console.debug('[CreateEventDialog] event created and added to store', created.id);

            goToDate(date);

            showToast('Cita creada correctamente', 'success');

            // Reset
            setTitle("");
            setDate(new Date());
            setStartTime("");
            setEndTime("");
            setMeetingLink("");
            setTimezone("");
            setParticipants("");
            // setName("");
            // setEmail("");
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to create event', err);
            showToast('Error de red al crear la cita', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Agendar Cita</DialogTitle>
                    <DialogDescription>
                        Agendar una nueva cita. Llenar los detalles.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Titulo</Label>
                            <Input
                                id="title"
                                placeholder="Titulo de la cita"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Fecha</Label>
                            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 size-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(selectedDate) => {
                                            setDate(selectedDate);
                                            setDatePickerOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* <div className="grid gap-2">
                            <Label htmlFor="name">Tu nombre</Label>
                            <Input
                                id="name"
                                placeholder="Tu nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div> */}

                        {/* <div className="grid gap-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div> */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Hora de inicio</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="endTime">Hora de finalización</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="participants">
                                Participantes (separados por comas)
                            </Label>
                            <Input
                                id="participants"
                                placeholder="user1, user2, user3"
                                value={participants}
                                onChange={(e) => setParticipants(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="meetingLink">Enlace de la reunion</Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="El Link llegara por correo"
                                value={meetingLink}
                                disabled={true}
                                onChange={(e) => setMeetingLink(e.target.value)}
                            />
                        </div>

                        {/* <div className="grid gap-2">
                            <Label htmlFor="timezone">Zona horaria (opcional)</Label>
                            <Input
                                id="timezone"
                                placeholder="GMT+7 Pontianak"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                            />
                        </div> */}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">Crear Cita</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
