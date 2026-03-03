import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Send, MessageSquare, Star, Heart } from 'lucide-react';

export default function FeedbackForm() {
  const [mood, setMood] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodOptions = [
    { emoji: '😠', label: 'Enojado', score: 1 },
    { emoji: '🙁', label: 'Triste', score: 2 },
    { emoji: '😐', label: 'Neutral', score: 5 },
    { emoji: '🙂', label: 'Bien', score: 8 },
    { emoji: '😊', label: 'Excelente', score: 10 },
  ];

  const submitFeedback = async () => {
    if (!mood) {
      toast.warning('Por favor, selecciona cómo te sientes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedMoodScore = moodOptions.find(o => o.emoji === mood)?.score || rating;
      const res = await fetch('/api/feedback/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, rating: selectedMoodScore, comment }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('¡Gracias por tu mensaje! Valoramos mucho tu opinión.');
        setMood('');
        setRating(5);
        setComment('');
      } else {
        toast.error('No se pudo enviar el feedback.');
      }
    } catch (error) {
      toast.error('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl p-8 md:p-12 max-w-xl w-full border border-gray-100 dark:border-gray-800 transition-all duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600 dark:text-green-400 mb-4">
          <Heart className="size-8 fill-current" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
          ¿Cómo va tu experiencia?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Tu feedback es el motor que nos ayuda a mejorar Psicologic cada día.
        </p>
      </div>

      {/* Mood Selector */}
      <div className="mb-12">
        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-6">
          Selecciona tu estado de ánimo
        </p>
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          {moodOptions.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => setMood(emoji)}
              className={`group relative flex flex-col items-center gap-2 transition-all duration-300 ${mood === emoji ? 'scale-110' : 'hover:scale-105 opacity-60 hover:opacity-100'
                }`}
            >
              <div className={`text-5xl sm:text-6xl p-2 rounded-3xl transition-all duration-300 ${mood === emoji
                  ? 'bg-green-100 dark:bg-green-900/30 shadow-lg shadow-green-500/20'
                  : 'bg-transparent'
                }`}>
                {emoji}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter transition-all ${mood === emoji ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Rating Range */}
      <div className="mb-10 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <label className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
            <Star className={`size-5 ${rating > 5 ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
            Nivel de Satisfacción
          </label>
          <span className="text-2xl font-black text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-4 py-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            {rating}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-green-600"
        />
        <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
          <span>Muy insatisfecho</span>
          <span>Excelente</span>
        </div>
      </div>

      {/* Comment Area */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 focus-within:ring-4 focus-within:ring-green-500/10 focus-within:border-green-500 transition-all">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
          <MessageSquare className="size-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase">Comentarios adicionales</span>
        </div>
        <textarea
          placeholder="Dinos qué podemos mejorar o qué es lo que más te gusta..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full h-32 p-4 bg-white dark:bg-gray-900 
                     text-gray-900 dark:text-white 
                     placeholder-gray-400 dark:placeholder-gray-500 
                     resize-none border-none focus:ring-0 text-sm leading-relaxed"
        ></textarea>
      </div>

      {/* Submit Button */}
      <button
        onClick={submitFeedback}
        disabled={!mood || isSubmitting}
        className={`group relative overflow-hidden w-full py-5 rounded-[1.5rem] font-black text-lg uppercase tracking-widest transition-all duration-500 shadow-xl
          ${!mood || isSubmitting
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed shadow-none'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/20 hover:shadow-green-600/40 active:scale-[0.98]'}`}
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          {isSubmitting ? (
            <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Enviar Experiencia
              <Send className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </>
          )}
        </span>
      </button>

      <p className="text-center mt-6 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
        Valoramos tu privacidad &bull; Psicologic Analytics
      </p>
    </div>
  );
}
