import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameMode = "besos" | "fuego" | "rayo";

interface CardQuestion {
  title: string | null;
  question: string;
}

interface CardData {
  id: string;
  question: CardQuestion;
  number: number;
  isFlipped: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const QuestionKiss: string[] = [
  "¿Cómo te imaginas nuestro futuro juntos?",
  "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
  "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
  "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
  "¿Hay algo que te gustaría que hiciéramos más a menudo?",
  "¿Hay algo que sientas que no hemos discutido lo suficiente?",
  "¿Cómo puedo animarte cuando te sientas triste?",
  "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
  "¿Cómo describirías nuestra relación en tres palabras?",
  "¿Qué te hace sentir más conectado/a conmigo?",
  "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
  "¿Qué es lo que te atrajo de mí cuando nos conocimos?",
  "¿Que es lo más te gusta de nuestra vida sexual?",
  "¿Hay algo en lo que te gustaría que trabajáramos como pareja?",
  "Conectamos",
  "¿Que es lo más te sorprende de mi?",
  "¿Que es lo más importante que has aprendido de nuestra relación?",
  "¿Para ti cuál ha sido el momento más difícil en nuestra relación?",
  "¿Cuál es tu mayor temor en nuestra relación?",
  "¿Qué te gustaría intentar o experimentar conmigo?",
];

const QuestionFire: string[] = [
  "¿Te gusta alguien del mismo sexo o te ha llamado la atención?",
  "¿Qué te excita más?",
  "Íntimo",
  "¿Te gusta hablar sucio durante el sexo?",
  "¿Qué opinas del sexo tántrico?",
  "¿Cuál es tu recuerdo sexual favorito de nosotros?",
  "¿Te gusta experimentar con juguetes sexuales?",
  "¿Qué es lo que más te gusta que te hagan para calentarte?",
  "¿Qué parte de mi cuerpo te atrae más?",
  "¿Hay algo que siempre hayas querido probar en la cama pero no lo has mencionado?",
  "¿Qué es lo más que disfrutas después del sexo?",
  "¿Prefieres ser dominante o sumiso/a en la cama?",
  "¿Hay algo que te gustaría mejorar o cambiar en nuestra vida sexual?",
  "¿Cuál es tu posición favorita?",
  "¿Qué prefieres, sexo rápido y apasionado o lento y romántico?",
  "¿Qué opinas del sexo en lugares públicos?",
  "¿Cómo te gusta que te toquen?",
  "¿Tienes alguna fantasía relacionada con los roles o disfraces?",
  "¿Te gusta probar nuevas técnicas o prefieres mantenerte con lo conocido?",
  "¿Cuál es tu fantasía sexual más secreta?",
];

const QuestionTruth: CardQuestion[] = [
  { title: "Declaración", question: "Hazle una declaración de amor improvisada a tu pareja." },
  { title: "Pregunta Íntima", question: "Responder sinceramente a una pregunta íntima de tu pareja." },
  { title: "Plan de fin de semana", question: "Organiza un plan para el fin de semana. Tiene que ser algo que hemos hecho antes." },
  { title: "Lista de deseos", question: "Crear juntos una lista de deseos sexuales para realizar a futuro." },
  { title: "Comodín", question: "Esta carta te ayuda a descartar una tarea del hogar que no te guste y no hacerla en toda la semana." },
  { title: "Striptease", question: "Haz un striptease a tu pareja." },
  { title: "Ejercicio Juntos", question: "Hacer una rutina de ejercicios juntos en ropa interior." },
  { title: "No Hablar", question: "Comunicarse solo con el cuerpo durante 10 min." },
  { title: "Deseo Secreto", question: "Cumplir un deseo secreto que tu pareja escriba en un papel." },
  { title: "Fotos Sensuales", question: "Tomarse fotos sensuales mutuamente." },
  { title: "Juego de Roles", question: "Intercambia roles durante 10 min y actúa como tu pareja." },
  { title: "Aumenta el pulso", question: "Dar besos por todo el cuerpo a tu pareja durante 5 min." },
  { title: "Frases de Amor", question: "Describe en una frase lo que sientes por tu pareja y léela en voz alta." },
  { title: "Retos", question: "¡Carta especial! Proponle un reto personal a tu pareja." },
  { title: "Los Ojos", question: "Mirarse fijamente a los ojos durante 3 min sin hablar." },
  { title: "Juego de Disfraces", question: "Disfrazarse y actuar una fantasía juntos." },
  { title: "Masaje Erótico", question: "Dedícale un masaje de 20 min a tu pareja usando aceites íntimos." },
  { title: "Baila Sensual", question: "Baila sensual para tu pareja." },
  { title: "Premio", question: "Te has ganado un desayuno en la cama." },
  { title: "Llamada Sexy", question: "Hacer una llamada o enviar mensajes picantes con tu pareja estando en la misma casa." },
];

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const THEME = {
  besos: {
    backBg:              "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 60%, #fbcfe8 100%)",
    backBorder:          "#f9a8d4",
    backColor:           "#be185d",
    faceBg:              "linear-gradient(160deg, #fff0f8 0%, #ffffff 100%)",
    faceBorder:          "#f9a8d4",
    faceColor:           "#831843",
    titleColor:          "#be185d",
    selectorActiveBorder:"#f472b6",
    selectorActiveBg:    "#fdf2f8",
    selectorGlow:        "rgba(244,114,182,.15)",
    topBar:              "linear-gradient(90deg,#f9a8d4,#f472b6)",
    iconBg:              "#fdf2f8",
    iconBorder:          "#fbcfe8",
    checkColor:          "#f472b6",
    modalAccent:         "#be185d",
  },
  fuego: {
    backBg:              "linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)",
    backBorder:          "#fb923c",
    backColor:           "#c2410c",
    faceBg:              "linear-gradient(160deg, #fffbf5 0%, #ffffff 100%)",
    faceBorder:          "#fb923c",
    faceColor:           "#9a3412",
    titleColor:          "#c2410c",
    selectorActiveBorder:"#f97316",
    selectorActiveBg:    "#fff7ed",
    selectorGlow:        "rgba(249,115,22,.15)",
    topBar:              "linear-gradient(90deg,#fbbf24,#f97316)",
    iconBg:              "#fff7ed",
    iconBorder:          "#fed7aa",
    checkColor:          "#f97316",
    modalAccent:         "#c2410c",
  },
  rayo: {
    backBg:              "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 60%, #c7d2fe 100%)",
    backBorder:          "#818cf8",
    backColor:           "#4338ca",
    faceBg:              "linear-gradient(160deg, #f5f6ff 0%, #ffffff 100%)",
    faceBorder:          "#818cf8",
    faceColor:           "#3730a3",
    titleColor:          "#4338ca",
    selectorActiveBorder:"#6366f1",
    selectorActiveBg:    "#eef2ff",
    selectorGlow:        "rgba(99,102,241,.15)",
    topBar:              "linear-gradient(90deg,#818cf8,#6366f1)",
    iconBg:              "#eef2ff",
    iconBorder:          "#c7d2fe",
    checkColor:          "#6366f1",
    modalAccent:         "#4338ca",
  },
} as const;

const MODE_LIST = [
  {
    id: "besos" as GameMode,
    label: "Conexión emocional",
    desc: "Preguntas para conocerse más",
    icon: "💞",
    modalTitle: "Conexión emocional",
    modalDesc:
      "Con esta categoría se busca fortalecer el vínculo mediante preguntas que permiten la apertura a una comunicación asertiva. Ideales para parejas que quieren conocerse más profundamente.",
  },
  {
    id: "fuego" as GameMode,
    label: "Preguntas íntimas",
    desc: "Para explorar juntos",
    icon: "🔥",
    modalTitle: "Preguntas íntimas",
    modalDesc:
      "Explorar la intimidad con tu pareja mediante preguntas profundas y atrevidas fortalece la conexión emocional y sexual, permitiendo descubrir deseos ocultos, fantasías y límites.",
  },
  {
    id: "rayo" as GameMode,
    label: "Retos",
    desc: "¿Te atreves a intentarlo?",
    icon: "⚡",
    modalTitle: "Retos",
    modalDesc:
      "Estos retos son actividades lúdicas diseñadas para fortalecer la conexión, aumentar la confianza y avivar la pasión, abarcando desde desafíos divertidos y románticos hasta juegos atrevidos.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCards(mode: GameMode): CardData[] {
  let pool: CardQuestion[] = [];
  if (mode === "besos")      pool = QuestionKiss.map((q) => ({ title: null, question: q }));
  else if (mode === "fuego") pool = QuestionFire.map((q) => ({ title: null, question: q }));
  else                       pool = [...QuestionTruth];

  return shuffle(pool)
    .slice(0, 20)
    .map((q, i) => ({
      id: `${mode}-${i}-${q.question.slice(0, 12)}`,
      question: q,
      number: i + 1,
      isFlipped: false,
    }));
}

// ─── InfoModal ────────────────────────────────────────────────────────────────
function InfoModal({
  modeId,
  onClose,
  onPlay,
}: {
  modeId: GameMode;
  onClose: () => void;
  onPlay: () => void;
}) {
  const t = THEME[modeId];
  const m = MODE_LIST.find((x) => x.id === modeId)!;

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
          animation: "modalFadeIn 0.2s ease",
        }}
      >
        {/* Box — stops click propagation so clicks inside don't close */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "0.5px solid #e5e7eb",
            maxWidth: 380, width: "100%",
            overflow: "hidden",
            animation: "modalSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "32px 28px 24px", textAlign: "center", gap: 12,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
              background: t.iconBg, border: `1.5px solid ${t.iconBorder}`,
            }}>
              {m.icon}
            </div>
            <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#111827" }}>
              {m.modalTitle}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "#e5e7eb", margin: "0 28px" }} />

          {/* Body */}
          <p style={{
            padding: "20px 28px 24px",
            fontSize: 14, lineHeight: 1.7,
            color: "#6b7280", textAlign: "center", margin: 0,
          }}>
            {m.modalDesc}
          </p>

          {/* Buttons */}
          <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={onPlay}
              style={{
                width: "100%", padding: "12px",
                borderRadius: 12,
                border: `1.5px solid ${t.selectorActiveBorder}`,
                background: t.selectorActiveBg,
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: t.modalAccent, transition: "opacity .15s",
              }}
            >
              Empezar a jugar
            </button>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px",
                borderRadius: 12,
                border: "0.5px solid #e5e7eb",
                background: "transparent",
                cursor: "pointer", fontSize: 14, fontWeight: 500,
                color: "#6b7280", transition: "background .15s",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ModeCard ─────────────────────────────────────────────────────────────────
function ModeCard({
  modeId, label, desc, icon, selected, onSelect, onInfo,
}: {
  modeId: GameMode; label: string; desc: string; icon: string;
  selected: boolean; onSelect: () => void; onInfo: () => void;
}) {
  const t = THEME[modeId];
  return (
    <div style={{
      position: "relative",
      cursor: "pointer",
      borderRadius: 16,
      border: `1.5px solid ${selected ? t.selectorActiveBorder : "#e5e7eb"}`,
      background: selected ? t.selectorActiveBg : "#fff",
      boxShadow: selected
        ? `0 0 0 3px ${t.selectorGlow}, 0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)`
        : "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
      transition: "border-color .2s, box-shadow .2s, transform .2s, background .2s",
      overflow: "hidden",
    }}>

      {/* Top accent bar */}
      <span style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        borderRadius: "16px 16px 0 0",
        background: t.topBar,
        opacity: selected ? 1 : 0,
        transition: "opacity .2s",
      }} />

      {/* Info button */}
      <button
        onClick={(e) => { e.stopPropagation(); onInfo(); }}
        title="Ver descripción"
        style={{
          position: "absolute", top: 8, right: 8,
          width: 22, height: 22, borderRadius: "50%",
          background: "rgba(255,255,255,0.85)",
          border: "0.5px solid rgba(0,0,0,0.12)",
          cursor: "pointer", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600, color: "#555",
          lineHeight: 1, padding: 0,
        }}
      >
        i
      </button>

      {/* Inner — click to select mode */}
      <div
        onClick={onSelect}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", padding: "18px 12px 16px", gap: 10,
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: "1.5rem", lineHeight: 1,
          background: t.iconBg, border: `1.5px solid ${t.iconBorder}`,
          transition: "transform .2s",
          transform: selected ? "scale(1.08)" : "scale(1)",
        }}>
          {icon}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#111827", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {label}
          </span>
          <span style={{ fontSize: "0.72rem", color: "#9ca3af", lineHeight: 1.3 }}>
            {desc}
          </span>
        </div>

        <svg viewBox="0 0 20 20" fill="none"
          style={{ width: 20, height: 20, color: t.checkColor, opacity: selected ? 1 : 0, transition: "opacity .2s, color .2s", flexShrink: 0 }}>
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── GameCard ─────────────────────────────────────────────────────────────────
function GameCard({ card, mode, delay, onToggle }: {
  card: CardData; mode: GameMode; delay: number; onToggle: (id: string) => void;
}) {
  const t = THEME[mode];
  return (
    <div style={{ perspective: "900px", animationDelay: `${delay}s`, animation: "cardAppear 0.35s ease both" }}>
      <div
        onClick={() => onToggle(card.id)}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "2 / 3",
          cursor: "pointer",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease",
          transform: card.isFlipped ? "rotateY(180deg) translateY(-3px)" : "translateY(0)",
          borderRadius: 14,
          userSelect: "none",
          boxShadow: card.isFlipped ? "0 8px 28px rgba(0,0,0,0.16)" : undefined,
        }}
      >
        {/* ── Back ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden", gap: 6,
          background: t.backBg, border: `2px solid ${t.backBorder}`, color: t.backColor,
          fontWeight: 800, letterSpacing: "-0.03em",
        }}>
          <span style={{ position: "absolute", top: 8, left: 10, fontSize: "0.6rem", opacity: 0.35 }}>♥</span>
          <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: "0.6rem", opacity: 0.35, transform: "rotate(180deg)" }}>♥</span>
          <img
            src={`/img/${mode}.svg`} alt={mode}
            style={{ width: 36, height: 36, objectFit: "contain", opacity: 0.9 }}
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
          <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{card.number}</span>
        </div>

        {/* ── Face ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden", padding: "12px 10px", textAlign: "center", gap: 6,
          background: t.faceBg, border: `2px solid ${t.faceBorder}`, color: t.faceColor,
        }}>
          {card.question.title && (
            <span style={{
              fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", opacity: 0.6, lineHeight: 1.2, color: t.titleColor,
            }}>
              {card.question.title}
            </span>
          )}
          <p style={{ fontSize: "0.72rem", fontWeight: 500, lineHeight: 1.45, margin: 0 }}>
            {card.question.question}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CartasGame() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [modalMode, setModalMode] = useState<GameMode | null>(null);

  const handleModeSelect = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    setCards(generateCards(mode));
  }, []);

  const handleCardToggle = useCallback((id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: !c.isFlipped } : c)));
  }, []);

  const handleModalPlay = useCallback(() => {
    if (modalMode) {
      handleModeSelect(modalMode);
      setModalMode(null);
    }
  }, [modalMode, handleModeSelect]);

  return (
    <>
      <style>{`
        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cartas-mode-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 0 20px;
          max-width: 700px;
          margin: 0 auto 32px;
          animation: fadeUp 0.4s ease both;
        }
        .cartas-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          padding: 20px 4px 40px;
        }
        @media (max-width: 480px) {
          .cartas-cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }
        .cartas-game-area {
          margin-top: 20px;
          padding: 0 20px 40px;
          width: 100%;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
          overflow-x: hidden;
          animation: fadeUp 0.4s 0.1s ease both;
        }
      `}</style>

      {/* Info Modal */}
      {modalMode && (
        <InfoModal
          modeId={modalMode}
          onClose={() => setModalMode(null)}
          onPlay={handleModalPlay}
        />
      )}

      <div style={{ background: "#fff", padding: "40px 0 60px", marginTop: 24, borderRadius: 20, overflow: "hidden" }}>

        {/* Mode selector */}
        <div className="cartas-mode-grid">
          {MODE_LIST.map(({ id, label, desc, icon }) => (
            <ModeCard
              key={id}
              modeId={id}
              label={label}
              desc={desc}
              icon={icon}
              selected={selectedMode === id}
              onSelect={() => handleModeSelect(id)}
              onInfo={() => setModalMode(id)}
            />
          ))}
        </div>

        {/* Cards */}
        <div className="cartas-game-area">
          {!selectedMode ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "56px 24px", gap: 12,
              color: "#9ca3af", textAlign: "center",
            }}>
              <span style={{ fontSize: "3rem", lineHeight: 1, opacity: 0.5 }}>🃏</span>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                Elige una categoría arriba<br />para empezar a jugar
              </p>
            </div>
          ) : (
            <div className="cartas-cards-grid">
              {cards.map((card, idx) => (
                <GameCard
                  key={card.id}
                  card={card}
                  mode={selectedMode}
                  delay={idx * 0.03}
                  onToggle={handleCardToggle}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}