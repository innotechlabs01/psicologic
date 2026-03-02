import React, { useState, useEffect } from 'react';
import { Skeleton } from '../../../components/ui/skeleton';

interface Appointment {
    date: string;
    startTime: string;
    endTime: string;
    meetingLink?: string;
}

interface ClientData {
    nextAppointment: Appointment | null;
    activeTicketsCount: number;
}

export const ClientDashboard: React.FC = () => {
    const [data, setData] = useState<ClientData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/client/dashboard-stats');
                const stats = await res.json();
                setData(stats);
            } catch (err) {
                console.error("Error fetching client dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b border-border">
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-48" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-12 w-48 rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-40 rounded-2xl" />
                        <Skeleton className="h-40 rounded-2xl" />
                    </div>
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b border-border">
                        <h3 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Próxima Cita
                        </h3>
                    </div>
                    <div className="p-8">
                        {data?.nextAppointment ? (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <p className="text-3xl font-bold text-foreground uppercase">{data.nextAppointment.date}</p>
                                    <p className="text-lg text-muted-foreground mt-2">{data.nextAppointment.startTime} - {data.nextAppointment.endTime}</p>
                                    <p className="text-sm font-medium text-primary mt-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                        Confirmada
                                    </p>
                                </div>
                                {data.nextAppointment.meetingLink && (
                                    <a
                                        href={data.nextAppointment.meetingLink}
                                        className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:scale-105"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Unirme a la Videollamada
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-6">No tienes citas programadas próximamente.</p>
                                <a href="/agenda" className="inline-flex items-center px-4 py-2 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors">
                                    Programar una Cita
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card p-6 rounded-2xl shadow-lg border border-border group hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-bold text-foreground">Mis Retos</h4>
                        <p className="text-sm text-muted-foreground mt-2">Visualiza y completa los retos asignados por tu terapeuta.</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl shadow-lg border border-border group hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-bold text-foreground">Recursos</h4>
                        <p className="text-sm text-muted-foreground mt-2">Accede a material de apoyo, guías y ejercicios recomendados.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
                    <h4 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Soporte Directo
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div>
                            <p className="text-2xl font-bold text-primary">{data?.activeTicketsCount || 0}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-tighter">Chats Abiertos</p>
                        </div>
                        <a href="/client/chat" className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            Ir al Chat
                        </a>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
                    <h4 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Suscripción Pro
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">Tu cuenta está activa y al día.</p>
                    <a href="/dashboard/payments" className="text-sm font-semibold text-primary hover:underline">Gestionar Pagos</a>
                </div>
            </div>
        </div>
    );
};
