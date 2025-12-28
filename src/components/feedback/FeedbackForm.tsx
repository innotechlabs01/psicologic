import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function FeedbackForm() {
  const [mood, setMood] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const moodOptions = [
    { emoji: '😠', score: 1 },
    { emoji: '🙁', score: 2 },
    { emoji: '😐', score: 5 },
    { emoji: '🙂', score: 8 },
    { emoji: '😊', score: 10 },
  ];

  // --- Estilos en línea para forzar la selección ---
  const selectedStyle = {
    transform: 'scale(1.25)',
    // (Esto simula: ring-4 ring-green-500 shadow-xl shadow-green-500/50)
    boxShadow: '0 0 0 4px #22c55e, 0 10px 15px -3px rgba(34, 197, 94, 0.4), 0 4px 6px -2px rgba(34, 197, 94, 0.2)',
    opacity: 1
  };

  const defaultStyle = {
    opacity: 0.75,
    transform: 'scale(1)',
    transition: 'all 0.3s ease'
  };

  // --- Estilos en línea para el botón de envío ---
  const enabledButtonStyle = {
    backgroundColor: '#16a34a', // bg-green-600
    color: 'white',
    transition: 'background-color 0.3s'
  };

  const disabledButtonStyle = {
    backgroundColor: 'var(--color-gris-claro)', // bg gray -> token
    color: 'var(--color-azul-oscuro)', // text -> token
    cursor: 'not-allowed'
  };


  const submitFeedback = async () => {
    // ... (la lógica de envío es correcta)
    if (!mood) {
      toast.warning('Por favor, selecciona un mood.');
      return;
    }
    const selectedMoodScore = moodOptions.find(o => o.emoji === mood)?.score || rating;
    const res = await fetch('/api/feedback/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, rating: selectedMoodScore, comment }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('¡Gracias por tu feedback!');
      setMood(''); setRating(5); setComment('');
    } else {
      toast.error('Hubo un error al enviar el feedback.');
      console.error(data.error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">¿Cómo te sientes?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Tu opinión nos ayuda a mejorar.</p>

      {/* Selector de Mood (Emojis) con Estilos en Línea */}
      <div className="flex justify-between mb-8 gap-4">
        {moodOptions.map(({ emoji }) => (
          <button
            key={emoji}
            // Clases base de Tailwind (las que sí funcionan)
            className="text-5xl p-3 rounded-full bg-gray-50 dark:bg-gray-700"
            // Estilos en línea forzados
            style={mood === emoji ? selectedStyle : defaultStyle}
            onClick={() => setMood(emoji)}
            aria-label={`Seleccionar mood ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Rango de Satisfacción (Rating) con Estilos en Línea */}
      <div className="mb-8">
        <label className="text-gray-900 dark:text-white block mb-2 font-medium">
            Satisfacción (1-10): <span className="font-bold text-green-600 dark:text-green-400 ml-2">{rating}</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-600"
          // Estilo en línea para forzar el color 'accent'
          style={{ accentColor: '#16a34a' }}
        />
      </div>

      {/* Área de Comentarios (Funciona bien) */}
      <textarea
        placeholder="Cuéntanos más... (Opcional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="w-full h-32 p-4 rounded-lg resize-none 
                   bg-white dark:bg-gray-700 
                   text-gray-900 dark:text-white 
                   placeholder-gray-500 dark:placeholder-gray-400 
                   border border-gray-300 dark:border-gray-600 
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
      ></textarea>

      {/* Botón de Envío con Estilos en Línea */}
      <button
        // Clases base de Tailwind
        className="mt-6 w-full py-3 rounded-lg font-semibold flex items-center justify-center"
        // Estilos en línea forzados
        style={!mood ? disabledButtonStyle : enabledButtonStyle}
        onClick={submitFeedback}
        disabled={!mood} 
      >
        Enviar Feedback <span className="ml-3 text-lg">🚀</span>
      </button>
    </div>
  );
}
