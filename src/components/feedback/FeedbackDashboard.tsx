import React, { useState, useEffect } from 'react';

interface Feedback {
  id: string;
  user_id: string;
  mood: string;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
}

interface FeedbackStats {
  mood: string;
  count: number;
}

export default function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats[]>([]);
  const [avgRating, setAvgRating] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback/feedback');
      const data = await res.json();
      
      if (data.success) {
        setFeedback(data.feedback || []);
        setStats(data.stats || []);
        setAvgRating(data.avgRating || '0');
      } else if (res.status === 403) {
        setError('No tienes permiso para ver esta información');
      } else {
        setError(data.error || 'Error al cargar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const moodEmojis: Record<string, string> = {
    '😠': 'Muy insatisfecho',
    '🙁': 'Insatisfecho',
    '😐': 'Neutral',
    '🙂': 'Satisfecho',
    '😊': 'Muy satisfecho',
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Promedio de Satisfacción</p>
          <p className="text-3xl font-bold text-primary">{avgRating}/10</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Total de Feedback</p>
          <p className="text-3xl font-bold">{feedback.length}</p>
        </div>
        {stats.slice(0, 2).map((stat) => (
          <div key={stat.mood} className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
            <span className="text-4xl">{stat.mood}</span>
            <div>
              <p className="text-sm text-muted-foreground">{moodEmojis[stat.mood] || stat.mood}</p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mood Distribution */}
      {stats.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Distribución de Estados de Ánimo</h3>
          <div className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div key={stat.mood} className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                <span className="text-2xl">{stat.mood}</span>
                <span className="text-sm font-medium">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Comentarios Recientes</h3>
        
        {feedback.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay feedback disponible</p>
        ) : (
          <div className="space-y-4">
            {feedback.map((fb) => (
              <div key={fb.id} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{fb.mood}</span>
                    <div>
                      <p className="font-medium">{fb.username}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      fb.rating >= 7 ? 'bg-green-100 text-green-700' :
                      fb.rating >= 4 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {fb.rating}/10
                    </span>
                  </div>
                </div>
                {fb.comment && (
                  <p className="mt-2 text-muted-foreground">{fb.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
