import React from 'react';

function SkeletonCard() {
    return (
        <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-6 bg-muted rounded w-1/2" />
                </div>
            </div>
        </div>
    );
}

interface Stats {
    countUser: number;
    countTicket: number;
    countChatActive: number;
    countChatClose: number;
}

export const DashboardStats: React.FC = () => {
    const [stats, setStats] = React.useState<Stats | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (isMounted) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchStats();
        
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        );
    }

    const StatCard = ({ title, value, icon, colorClass }: { title: string, value?: number, icon: React.ReactNode, colorClass: string }) => (
        <div className="bg-card hover:bg-card/80 transition-all duration-300 rounded-2xl shadow-lg border border-border p-5 flex items-center gap-4">
            <div className={`p-3 ${colorClass} rounded-xl`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-foreground">{value ?? 0}</h3>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Usuarios Nuevos"
                value={stats?.countUser}
                colorClass="bg-blue-500/10 text-blue-500"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
            />
            <StatCard
                title="Pendientes"
                value={stats?.countTicket}
                colorClass="bg-amber-500/10 text-amber-500"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            />
            <StatCard
                title="Chats Activos"
                value={stats?.countChatActive}
                colorClass="bg-purple-500/10 text-purple-500"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
            <StatCard
                title="Completados"
                value={stats?.countChatClose}
                colorClass="bg-emerald-500/10 text-emerald-500"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
        </div>
    );
};
