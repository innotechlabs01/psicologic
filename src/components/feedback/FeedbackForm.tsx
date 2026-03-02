import React, { useState } from 'react';

export default function FeedbackForm() {
  const [mood, setMood] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const moodOptions = [
    { emoji: '😠', score: 1, label: 'Muy mal' },
    { emoji: '🙁', score: 3, label: 'Mal' },
    { emoji: '😐', score: 5, label: 'Regular' },
    { emoji: '🙂', score: 7, label: 'Bien' },
    { emoji: '😊', score: 10, label: 'Excelente' },
  ];

  const submitFeedback = async () => {
    if (!mood) return;
    
    setSending(true);
    try {
      const selectedMood = moodOptions.find(o => o.emoji === mood);
      const res = await fetch('/api/feedback/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood, 
          rating: selectedMood?.score || rating, 
          comment 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSent(true);
        setMood('');
        setRating(5);
        setComment('');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">¡Gracias!</h2>
        <p className="text-muted-foreground mb-6">Tu opinión nos ayuda a mejorar.</p>
        <button
          onClick={() => setSent(false)}
          className="text-primary hover:underline"
        >
          Enviar otro feedback
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">¿Cómo te sientes?</h2>
      <p className="text-muted-foreground mb-6 sm:mb-8">Tu opinión nos ayuda a mejorar.</p>

      {/* Mood Selector */}
      <div className="flex justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
        {moodOptions.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => setMood(emoji)}
            className={`flex-1 p-2 sm:p-3 rounded-xl transition-all duration-200 text-3xl sm:text-4xl ${
              mood === emoji
                ? 'bg-primary/10 scale-110 ring-2 ring-primary'
                : 'bg-muted/50 hover:bg-muted'
            }`}
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Rating Slider */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">Satisfacción</label>
          <span className="text-lg font-bold text-primary">{rating}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Malo</span>
          <span>Excelente</span>
        </div>
      </div>

      {/* Comment */}
      <textarea
        placeholder="Cuéntanos más... (Opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full h-24 sm:h-32 p-3 sm:p-4 rounded-lg resize-none bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
      />

      {/* Submit Button */}
      <button
        onClick={submitFeedback}
        disabled={!mood || sending}
        className={`mt-6 w-full py-3 rounded-lg font-semibold transition-colors ${
          mood
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {sending ? 'Enviando...' : 'Enviar Feedback'}
      </button>
    </div>
  );
}
