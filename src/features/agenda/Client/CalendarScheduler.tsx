import { useState, useEffect } from 'react';
import { useAgendaCache } from '../../../hooks/useAgendaCache'; // Adjust path
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { BookingClientModal } from '../BookingClientModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarScheduler = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const { getCachedEvents, setCachedEvents } = useAgendaCache();

    // Fetch events on mount and when month changes
    useEffect(() => {
        const fetchEvents = async () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // 1. Try Cache
            const cached = getCachedEvents(new Date(year, month, 1), new Date(year, month + 1, 0));
            if (cached) {
                setBookings(cached);
                setLoading(false);
                return;
            }

            // 2. Fetch if miss
            try {
                // Fetching wider range (current month -1 to +3)
                // Note: For cleaner caching we might want to just fetch THIS month and cache it by month-key
                // But keeping the logic simple: fetch range, cache result under current month key
                const start = new Date(year, month - 1, 1);
                const end = new Date(year, month + 2, 0);

                const res = await fetch(`/api/agenda?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setBookings(data);
                    setCachedEvents(year, month, data);
                }
                setLoading(false);
            } catch (e) {
                console.error("Error fetching events", e);
                setLoading(false);
            }
        };
        fetchEvents();
    }, [currentDate.getMonth(), currentDate.getFullYear()]);

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 Sunday

    const renderDays = () => {
        const days = [];
        // Empty slots
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-12"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = date.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateKey;

            // For now, allow booking on any day in the future
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const isPast = date < startOfToday;
            const dayEvents = bookings.filter((b) => b.date === dateKey);

            // Improved cell styling: taller, padded, and with a badge for count
            let className =
                'h-20 p-2 flex flex-col items-start justify-between rounded-lg border transition-colors duration-150 relative overflow-hidden';
            if (isToday) className += ' border-primary bg-primary/10';
            if (isPast) className += ' opacity-60 cursor-not-allowed bg-muted/30';
            else className += ' hover:bg-accent/50 cursor-pointer';

            days.push(
                <div
                    key={`day-${day}`}
                    className={className}
                    onClick={() => {
                        if (!isPast) {
                            setSelectedDate(dateKey);
                            setShowModal(true);
                        }
                    }}
                >
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium">{day}</span>
                        {dayEvents.length > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full">
                                {dayEvents.length}
                            </span>
                        )}
                    </div>

                    <div className="w-full text-xs text-muted-foreground truncate">
                        {dayEvents.slice(0, 2).map((ev: any, idx: number) => (
                            <div key={idx} className="truncate">{ev.title || ev.participants?.name || 'Reserva'}</div>
                        ))}
                        {dayEvents.length > 2 && (
                            <div className="text-[11px] text-muted-foreground">+{dayEvents.length - 2} más</div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto bg-card text-card-foreground p-6 rounded-xl shadow-lg border border-border">
            <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronLeft /></button>
                    <h2 className="text-xl font-bold capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronRight /></button>
                </div>

                <div className="grid grid-cols-7 gap-3 text-center mb-2 font-semibold text-muted-foreground text-sm">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 gap-3">
                    {loading ? (
                        // Render skeleton placeholders for the calendar grid
                        Array.from({ length: 42 }).map((_, i) => (
                            <div key={`sk-${i}`} className="h-20 rounded-lg bg-muted animate-pulse" />
                        ))
                    ) : (
                        renderDays()
                    )}
                </div>
            </div>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agendar para {selectedDate}</DialogTitle>
                    </DialogHeader>
                    {selectedDate && (
                        <BookingClientModal
                            selectedDate={selectedDate}
                            onClose={() => setShowModal(false)}
                            onSuccess={() => {
                                // Refresh bookings or just close
                                // setShowModal(false); // Keep open to show success
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
