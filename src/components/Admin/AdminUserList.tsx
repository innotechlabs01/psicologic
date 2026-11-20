"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Users,
    Search,
    RefreshCw,
    UserCheck,
    UserX,
    Ban,
    Shield,
} from "lucide-react";

interface CrmUser {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    avatar_url: string | null;
    status: string;
    role: string;
    patientsCount: number;
    sessionsCount: number;
    created_at: string | null;
}

type StatusFilter = "all" | "pending_approval" | "active" | "blocked";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    approved: { label: "Activo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    active: { label: "Activo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending_approval: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    rejected: { label: "Rechazado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
    suspended: { label: "Suspendido", cls: "bg-zinc-100 text-zinc-700 border-zinc-200" },
    denied: { label: "Bloqueado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const ROLE_LABELS: Record<string, string> = {
    "org:admin": "Administrador",
    "org:client": "Psicólogo",
    "org:moderator": "Moderador / Juego",
};

export function AdminUserList() {
    const [users, setUsers] = useState<CrmUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [confirming, setConfirming] = useState<{ userId: string; action: 'approve' | 'reject' | 'suspend' } | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users/list', { credentials: 'include' });
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', text: 'No se pudieron cargar los usuarios del CRM' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (userId: string, action: 'approve' | 'reject' | 'suspend') => {
        setBusyId(userId);
        setFeedback(null);
        try {
            const res = await fetch(`/api/users/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!res.ok) throw new Error(`Error al ejecutar ${action}`);

            const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
            setFeedback({
                type: 'success',
                text: `Usuario ${action === 'approve' ? 'aprobado' : action === 'reject' ? 'rechazado' : 'suspendido'} correctamente`,
            });
            setConfirming(null);
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', text: 'No se pudo actualizar el estado del usuario' });
        } finally {
            setBusyId(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setBusyId(userId);
        setFeedback(null);
        try {
            const res = await fetch('/api/users/change-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newRole }),
            });
            if (!res.ok) throw new Error('Error cambiando rol');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setFeedback({ type: 'success', text: `Rol actualizado a ${ROLE_LABELS[newRole] || newRole}` });
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', text: 'No se pudo cambiar el rol del usuario' });
        } finally {
            setBusyId(null);
        }
    };

    const counts = useMemo(() => ({
        all: users.length,
        pending: users.filter(u => u.status === 'pending_approval').length,
        active: users.filter(u => u.status === 'approved' || u.status === 'active').length,
        blocked: users.filter(u => ['rejected', 'suspended', 'denied'].includes(u.status)).length,
    }), [users]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter(u => {
            const fullName = `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase();
            const matches = !q || fullName.includes(q) || u.email.toLowerCase().includes(q);
            if (!matches) return false;
            if (filter === 'pending_approval') return u.status === 'pending_approval';
            if (filter === 'active') return u.status === 'approved' || u.status === 'active';
            if (filter === 'blocked') return ['rejected', 'suspended', 'denied'].includes(u.status);
            return true;
        });
    }, [users, search, filter]);

    if (loading && users.length === 0) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800" />
                    ))}
                </div>
                <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {feedback && (
                <div
                    role="alert"
                    className={`px-4 py-3 rounded-xl text-sm font-semibold border ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                >
                    {feedback.text}
                </div>
            )}

            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Total Usuarios</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{counts.all}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Activos</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{counts.active}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-semibold text-amber-600 uppercase">Pendientes</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{counts.pending}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-semibold text-rose-600 uppercase">Suspendidos / Bloq.</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{counts.blocked}</p>
                </div>
            </div>

            {/* Directory Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                            <Users className="w-5 h-5" />
                        </span>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Directorio y Permisos</h2>
                            <p className="text-xs text-gray-500">Gestiona aprobaciones, roles y estado de cada psicólogo.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar psicólogo o correo..."
                                className="pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                            />
                        </div>
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                    {([
                        { key: 'all', label: `Todos (${counts.all})` },
                        { key: 'pending_approval', label: `Pendientes (${counts.pending})` },
                        { key: 'active', label: `Activos (${counts.active})` },
                        { key: 'blocked', label: `Suspendidos/Bloq. (${counts.blocked})` },
                    ] as { key: StatusFilter; label: string }[]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                filter === tab.key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                <th className="py-3.5 px-5">Usuario</th>
                                <th className="py-3.5 px-4">Estado</th>
                                <th className="py-3.5 px-4">Rol</th>
                                <th className="py-3.5 px-4 text-right">Pacientes / Citas</th>
                                <th className="py-3.5 px-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-400 text-sm">
                                        No hay usuarios que coincidan con el filtro seleccionado.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(user => {
                                    const badge = STATUS_BADGE[user.status] || {
                                        label: user.status,
                                        cls: "bg-gray-100 text-gray-700 border-gray-200",
                                    };
                                    const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
                                        || user.username
                                        || user.email.split('@')[0];
                                    const isConfirming = confirming?.userId === user.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center uppercase font-bold text-xs">
                                                            {displayName.slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                                                    <select
                                                        value={user.role}
                                                        disabled={busyId === user.id}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        className="text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value="org:client">Psicólogo</option>
                                                        <option value="org:admin">Administrador</option>
                                                        <option value="org:moderator">Moderador</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                {user.patientsCount} pac. · {user.sessionsCount} citas
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                {isConfirming ? (
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <span className="text-xs text-gray-500 font-semibold">
                                                            ¿{confirming.action === 'approve' ? 'Aprobar' : confirming.action === 'reject' ? 'Rechazar' : 'Suspender'}?
                                                        </span>
                                                        <button
                                                            disabled={busyId === user.id}
                                                            onClick={() => handleAction(user.id, confirming.action)}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                                        >
                                                            Confirmar
                                                        </button>
                                                        <button
                                                            disabled={busyId === user.id}
                                                            onClick={() => setConfirming(null)}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {user.status !== 'approved' && user.status !== 'active' && (
                                                            <button
                                                                onClick={() => setConfirming({ userId: user.id, action: 'approve' })}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                                            >
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                Aprobar
                                                            </button>
                                                        )}
                                                        {user.status === 'pending_approval' && (
                                                            <button
                                                                onClick={() => setConfirming({ userId: user.id, action: 'reject' })}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                                                            >
                                                                <UserX className="w-3.5 h-3.5" />
                                                                Rechazar
                                                            </button>
                                                        )}
                                                        {(user.status === 'approved' || user.status === 'active') && user.role !== 'org:admin' && (
                                                            <button
                                                                onClick={() => setConfirming({ userId: user.id, action: 'suspend' })}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 text-xs font-semibold border border-gray-200"
                                                            >
                                                                <Ban className="w-3.5 h-3.5" />
                                                                Suspender
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
