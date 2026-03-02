import React, { useState, useEffect } from 'react';

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  pendingTickets: number;
  avgRating: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Ticket {
  ticket_id: string;
  user_name: string;
  last_message: string;
  fecha: number;
}

interface FeedbackItem {
  id: string;
  mood: string;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
}

type Tab = 'overview' | 'users' | 'tickets' | 'feedback' | 'settings';

export default function AdminDashboard({ currentUserRole }: { currentUserRole: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeSubscriptions: 0, pendingTickets: 0, avgRating: '0' });
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  const isAgent = currentUserRole === 'agente_soporte' || currentUserRole === 'org:admin';

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, ticketsRes, feedbackRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/users'),
        fetch('/api/tickets/admin/list'),
        fetch('/api/feedback/feedback')
      ]);

      const [statsData, usersData, ticketsData, feedbackData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        ticketsRes.json(),
        feedbackRes.json()
      ]);

      setStats({
        totalUsers: Array.isArray(statsData) ? statsData.length : 0,
        activeSubscriptions: Array.isArray(statsData) ? statsData.filter((u: any) => u.status === 'active').length : 0,
        pendingTickets: ticketsData.tickets?.length || 0,
        avgRating: feedbackData.avgRating || '0'
      });

      setUsers(Array.isArray(usersData) ? usersData.slice(0, 10) : []);
      setTickets(ticketsData.tickets || []);
      setFeedback(feedbackData.feedback || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'users', label: 'Usuarios', icon: '👥' },
    { id: 'tickets', label: 'Tickets', icon: '💬' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'settings', label: 'Ajustes', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Total Usuarios</p>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Suscripciones Activas</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Tickets Abiertos</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingTickets}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Rating Promedio</p>
            <p className="text-3xl font-bold text-blue-600">{stats.avgRating}/10</p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Gestión de Usuarios</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay usuarios</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/50">
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-muted rounded text-xs">{user.role}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Tickets de Soporte</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay tickets activos</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.ticket_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{ticket.user_name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">{ticket.last_message}</p>
                  </div>
                  <a
                    href={`/admin/tickets/${ticket.ticket_id}`}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
                  >
                    Ver
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Feedback de Usuarios</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay feedback</p>
          ) : (
            <div className="space-y-4">
              {feedback.slice(0, 10).map((fb) => (
                <div key={fb.id} className="border-b border-border pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{fb.mood}</span>
                    <div>
                      <p className="font-medium">{fb.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`ml-auto px-2 py-1 rounded text-xs ${
                      fb.rating >= 7 ? 'bg-green-100 text-green-700' :
                      fb.rating >= 4 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {fb.rating}/10
                    </span>
                  </div>
                  {fb.comment && <p className="text-muted-foreground text-sm">{fb.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Configuración</h3>
          <div className="space-y-4">
            <a href="/client/settings/template" className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted">
              <div>
                <p className="font-medium">Template de Historia Clínica</p>
                <p className="text-sm text-muted-foreground">Personaliza los campos</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
            <a href="/agenda" className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted">
              <div>
                <p className="font-medium">Configuración de Agenda</p>
                <p className="text-sm text-muted-foreground">Horarios y disponibilidad</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
