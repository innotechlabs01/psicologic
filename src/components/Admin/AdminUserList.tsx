"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface PendingUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
}

export function AdminUserList() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users/pending');
                if (!response.ok) throw new Error('Error al cargar usuarios');
                const data = await response.json();
                setUsers(data || []);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar usuarios pendientes");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        const message = action === 'approve' ? '¿Aprobar este usuario?' : '¿Rechazar este usuario?';
        if (!window.confirm(message)) return;

        try {
            const res = await fetch(`/api/users/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!res.ok) throw new Error(`Error al ${action} usuario`);

            toast.success(`Usuario ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error(error);
            toast.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} usuario`);
        }
    };

    if (loading) {
        return (
            <div role="status" className="max-w-sm animate-pulse">
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">No hay usuarios pendientes de aprobación.</p>
                <ToastContainer />
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            <ToastContainer />
            {users.map(user => (
                <div key={user.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 uppercase font-bold">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">{user.first_name} {user.last_name}</h3>
                                <p className="text-gray-600">{user.email}</p>
                                <p className="text-sm text-gray-500 mt-1">Registrado: {new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <button
                                onClick={() => handleAction(user.id, 'approve')}
                                className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors"
                            >
                                Aprobar
                            </button>
                            <button
                                onClick={() => handleAction(user.id, 'reject')}
                                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
                            >
                                Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
