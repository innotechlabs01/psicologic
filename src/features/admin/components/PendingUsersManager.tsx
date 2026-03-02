import React, { useState, useEffect } from 'react';

interface PendingUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function PendingUsersManager() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!confirm('¿Aprobar este usuario?')) return;
    setProcessing(userId);
    try {
      const res = await fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert('Error al aprobar usuario');
      }
    } catch (err) {
      alert('Error al aprobar usuario');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('¿Rechazar este usuario?')) return;
    setProcessing(userId);
    try {
      const res = await fetch('/api/users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert('Error al rechazar usuario');
      }
    } catch (err) {
      alert('Error al rechazar usuario');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-destructive/50 rounded-lg p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground">No hay usuarios pendientes de aprobación.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {users.map(user => (
        <div key={user.id} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">{(user.first_name || user.username || 'U').charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registrado: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(user.id)}
                disabled={processing === user.id}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {processing === user.id ? '...' : 'Aprobar'}
              </button>
              <button
                onClick={() => handleReject(user.id)}
                disabled={processing === user.id}
                className="bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {processing === user.id ? '...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
