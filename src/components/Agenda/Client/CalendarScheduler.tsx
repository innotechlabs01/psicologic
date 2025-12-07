import { useState, useEffect } from 'react';
import { useAgendaCache } from '../../../hooks/useAgendaCache'; // Adjust path
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { BookingClientModal } from '../BookingClientModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarScheduler = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const { getCachedEvents, setCachedEvents } = useAgendaCache();

    // Fetch events on mount and when month changes
    useEffect(() => {
        const fetchEvents = async () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // 1. Try Cache
            const cached = getCachedEvents(year, month);
            if (cached) {
                setBookings(cached);
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
            } catch (e) {
                console.error("Error fetching events", e);
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

            // Check functionality
            // For now, allow booking on any day in the future
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            const dayEvents = bookings.filter(b => b.date === dateKey);

            let className = "h-14 flex flex-col items-center justify-center rounded-lg border cursor-pointer transition hover:bg-indigo-50 relative group ";
            if (isToday) className += " border-indigo-500 bg-indigo-50 font-bold";
            if (isPast) className += " opacity-50 cursor-not-allowed bg-gray-100";

            days.push(
                <div
                    key={day}
                    className={className}
                    onClick={() => {
                        if (!isPast) {
                            setSelectedDate(dateKey);
                            setShowModal(true);
                        }
                    }}
                >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                        <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-xl">
            <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
                    <h2 className="text-xl font-bold capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center mb-2 font-semibold text-gray-500 text-sm">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {renderDays()}
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
