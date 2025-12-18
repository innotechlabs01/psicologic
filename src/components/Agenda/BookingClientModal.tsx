import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, Calendar, Mail, CheckCircle, Video } from 'lucide-react';
import { useAgendaCache } from '../../hooks/useAgendaCache'; // Import hook
import { SkeletonLine, SkeletonCard } from './ui/skeleton';

interface BookingClientModalProps {
    selectedDate: string;
    onClose: () => void;
    onSuccess?: (data: any) => void;
    loadingExternal?: boolean;
}

export function BookingClientModal({ selectedDate, onClose, onSuccess, loadingExternal = false }: BookingClientModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [time, setTime] = useState('09:00');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { addEventToCache } = useAgendaCache(); // Use hook

    const handleBook = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/agenda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate, // YYYY-MM-DD
                    startTime: time,
                    name,
                    email
                })
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);

                // Optimistic Cache Update
                // Map the API response (AgendaEvent) to the UI Event format
                // This ensures the calendar view can read it directly from cache
                const mappedEvent = {
                    id: data.id,
                    title: data.title,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    date: data.date,
                    participants: data.participants ? [data.participants] : [],
                    meetingLink: data.meetingLink,
                    timezone: 'America/Bogota'
                };

                addEventToCache(mappedEvent);

                if (onSuccess) onSuccess(data);
            } else {
                alert(data.error || 'Error booking');
            }
        } catch (e) {
            console.error(e);
            alert('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const getICSEventURL = (booking: any) => {
        const startTime = new Date(`${booking.date}T${booking.startTime}:00`);
        const duration = 60 * 60 * 1000; // 60 minutes default
        const endTime = new Date(startTime.getTime() + duration);

        const formatICSDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const calendarContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TuEmpresa//Cita//ES
BEGIN:VEVENT
UID:${booking.secureToken}@tuempresa.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startTime)}
DTEND:${formatICSDate(endTime)}
SUMMARY:Cita de Asesoría con ${booking.name}
DESCRIPTION:Video Conferencia a través de WebRTC. \\nLink: ${booking.meetingLink}
LOCATION:${booking.meetingLink}
END:VEVENT
END:VCALENDAR`.trim();

        const blob = new Blob([calendarContent], { type: 'text/calendar;charset=utf-8' });
        return URL.createObjectURL(blob);
    };

    if (result) {
        return (
            <div className="p-6 space-y-4 text-center">
                <div className="flex justify-center text-green-500 mb-2"><CheckCircle size={48} /></div>
                <h3 className="text-2xl font-bold text-green-700">¡Cita Confirmada!</h3>
                <p className="text-gray-600">Hemos enviado un correo a <span className="font-semibold">{email}</span></p>

                <div className="bg-gray-100 p-4 rounded-lg my-4 text-left text-sm">
                    <p><strong>Fecha:</strong> {selectedDate}</p>
                    <p><strong>Hora:</strong> {time}</p>
                    <p className="truncate mt-2"><strong>Link:</strong> <a href={result.meetingLink} className="text-blue-600 underline">{result.meetingLink}</a></p>
                </div>

                <div className="grid gap-2">
                    <a href={result.meetingLink} target="_blank" className="w-full btn-primary flex items-center justify-center gap-2 p-2 bg-indigo-600 text-white rounded-md">
                        <Video size={16} /> Ir a la Sala (Ahora)
                    </a>
                    <a href={getICSEventURL(result)} download="cita.ics" className="w-full flex items-center justify-center gap-2 p-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <Calendar size={16} /> Descargar Calendario (ICS)
                    </a>
                    <a href={`mailto:${email}?subject=Confirmacion&body=Link: ${result.meetingLink}`} className="w-full flex items-center justify-center gap-2 p-2 bg-gray-200 rounded-md text-gray-700">
                        <Mail size={16} /> Re-enviar Email
                    </a>
                </div>
            </div>
        );
    }

        if (loadingExternal) {
            return (
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="text-indigo-600" /> Agendar Cita: {selectedDate}</h3>
                    <SkeletonCard />
                    <div className="mt-4">
                        <SkeletonLine className="w-full" />
                        <SkeletonLine className="w-3/4 mt-2" />
                        <SkeletonLine className="w-1/2 mt-2" />
                    </div>
                </div>
            );
        }

    return (
        <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="text-indigo-600" /> Agendar Cita: {selectedDate}</h3>

            <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" />
            </div>

            <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@ejemplo.com" />
            </div>

            <div className="space-y-2">
                <Label>Hora (Inicio)</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={time} onChange={e => setTime(e.target.value)}>
                    {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <Button onClick={handleBook} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Confirmar Reserva'}
            </Button>
        </div>
    );
}
