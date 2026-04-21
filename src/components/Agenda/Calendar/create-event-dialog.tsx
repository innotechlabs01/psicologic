"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
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
import { getHoliday } from "./calendar-utils";

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventToEdit?: any;
    onSuccess?: () => void;
}

/* --- UTILITIES --- */
const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

const minutesToTime = (totalMinutes: number): string => {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export function CreateEventDialog({
    open,
    onOpenChange,
    eventToEdit,
    onSuccess
}: CreateEventDialogProps) {
    const { addEvent, goToDate } = useCalendarStore();
    const { addEventToCache, invalidateCache } = useAgendaCache();

    // Form States
    const [title, setTitle] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [participants, setParticipants] = useState("");

    // UI States
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isManualEndTime, setIsManualEndTime] = useState(false);
    const [duration, setDuration] = useState("30");

    // Sincronizar formulario cuando el evento a editar cambia o el diálogo se abre
    useEffect(() => {
        if (open) {
            setTitle(eventToEdit?.title || "");
            setDate(eventToEdit?.date ? new Date(eventToEdit.date + 'T00:00:00') : new Date());
            setStartTime(eventToEdit?.startTime || "");
            setEndTime(eventToEdit?.endTime || "");
            setParticipants(eventToEdit?.participants ? eventToEdit.participants.join(', ') : "");
            setIsManualEndTime(!!eventToEdit);
        }
    }, [eventToEdit, open]);

    // Opciones de duración precalculadas
    const durationOptions = useMemo(() => [
        5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480
    ], []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Cálculo de hora final si no es manual
        const finalEndTime = isManualEndTime
            ? endTime
            : minutesToTime(timeToMinutes(startTime) + parseInt(duration));

        if (!title || !date || !startTime || !finalEndTime) {
            showToast('Por favor completa los campos obligatorios.', 'error');
            return;
        }

        const holiday = getHoliday(date);
        if (holiday) {
            showToast(`No se pueden agendar citas en días festivos: ${holiday}`, 'error');
            return;
        }

        const participantsList = participants
            .split(",")
            .map(p => p.trim())
            .filter(p => p.length > 0);

        const payload = {
            title,
            date: format(date, "yyyy-MM-dd"),
            startTime,
            endTime: finalEndTime,
            participants: participantsList,
        };

        setSubmitting(true);
        try {
            const url = eventToEdit ? `/api/agenda/${eventToEdit.id}` : '/api/agenda';
            const method = eventToEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data?.error || 'Error al procesar la solicitud');

            showToast(eventToEdit ? 'Cita actualizada' : 'Cita creada', 'success');

            // Actualización de caches y stores
            invalidateCache();

            if (onSuccess) {
                onSuccess();
            }

            const eventData = {
                ...payload,
                id: data.id || eventToEdit?.id,
                meetingLink: data.meetingLink,
            };

            if (!eventToEdit) {
                addEvent(eventData);
                addEventToCache(eventData);
                goToDate(date);
            } else {
                // En lugar de reload, invalidamos y cerramos para que el padre refresque
                invalidateCache();
            }

            onOpenChange(false);
            resetForm();
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDate(new Date());
        setStartTime("");
        setEndTime("");
        setParticipants("");
        setDuration("30");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{eventToEdit ? "Editar Cita" : "Agendar Cita"}</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles de la sesión con el paciente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Consulta Psicológica"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Fecha</Label>
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : "Seleccionar fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => { setDate(d); setDatePickerOpen(false); }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startTime">Inicio</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                            <Label>{isManualEndTime ? "Fin" : "Duración"}</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                {isManualEndTime ? (
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                ) : (
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    >
                                        {durationOptions.map((mins) => (
                                            <option key={mins} value={mins}>
                                                {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 || ''}m` : `${mins} min`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="manualTime"
                            checked={isManualEndTime}
                            onChange={(e) => setIsManualEndTime(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <label htmlFor="manualTime" className="text-xs font-medium cursor-pointer">
                            Ajustar hora de fin manualmente
                        </label>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="participants">Emails de Pacientes</Label>
                        <Input
                            id="participants"
                            placeholder="paciente@correo.com, familiar@correo.com"
                            value={participants}
                            onChange={(e) => setParticipants(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {eventToEdit ? "Guardar Cambios" : "Crear Cita"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}