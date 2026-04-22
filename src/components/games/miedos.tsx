import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameMode =
  | "identificar_miedo"
  | "cuestionando_miedo"
  | "reencuadre"
  | "accion_confrontacion"
  | "liberacion_reconexion";

interface CardData {
  id: string;
  question: string;
  number: number;
  isFlipped: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const QuestionSets: Record<GameMode, string[]> = {
  identificar_miedo: [
    "¿Qué miedo es el que más me impide avanzar hoy?",
    "¿Qué dice este miedo de mi?",
    "¿Cuando fue la primera vez que senti este miedo?",
    "¿Qué evito por este miedo?",
    "¿Cómo reacciona mi cuerpo cuando tengo miedo?",
    "¿Cuándo aparece con mayor fuerza este miedo?",
    "¿Qué creo que pasará si me enfrento a este miedo?",
    "¿Qué estoy tratando de proteger al sentir este miedo?",
    "¿Este miedo me pertenece o aprendi a sentirlo de alguien?",
    "¿Cómo me trato cuando siento miedo?",
  ],
  cuestionando_miedo: [
    "¿Este miedo se basa en hechos o en suposiciones?",
    "¿Qué le diria a un amigo que sentiera el mismo miedo?",
    "¿Qué es lo peor que podría pasar? ¿Podría soportar eso?",
    "¿Cuáles son los posibilidades reales de que este miedo se haga realidad?",
    "¿Qué he hecho para mantener vivo este miedo?",
    "¿Este miedo me protege o me limita?",
    "Si este miedo tuvera voz ¿Qué diria?",
    "¿Qué creencias hay detrás de este miedo?",
    "¿Me he enfrentado a algo parecido antes? ¿Cómo fue?",
    "¿Qué evidencia tengo de que puedo manejar eso?",
  ],
  reencuadre: [
    "¿Qué podria este miedo estar intentando enseñarme?",
    "¿Qué aprendazaje hay detrás de este malestar?",
    "¿Qué parte de mí necesita ser fortalecida para superar este miedo?",
    "Si actuara con valentía, ¿Qué haría hoy?",
    "¿Quién seria yo sin este miedo?",
    "¿Qué oportunidades estoy perdiendo al darle espacio a este miedo?",
    "¿Cómo seria afrontar ese miedo con amabilidad y no con presión?",
    "¿Qué puedo hacer ahora mismo para sentirme un 5% más seguro?",
    "¿Quién me inspira a actuar con valentía?",
    "¿Qué frase puedo repetirme cuando este miedo aparece?",
  ],
  accion_confrontacion: [
    "¿Cuál es el primer paso (aunque sea pequeño) que puedo dar para afrontar este miedo?",
    "¿Qué me fortalece cuando tengo miedo?",
    "¿Qué tipo de apoyo puedo buscar para afrontar este reto?",
    "¿Qué plan práctico puedo crear para abordar este miedo gradualmente?",
    "¿Cuál es el escenario más realista —ni el peor ni el mejor— para esta situación?",
    "¿Cómo puedo celebrar cada paso adelante, por pequeño que sea?",
    "¿Qué puedo hacer cuando el miedo intenta nuevamente paralizarme?",
    "¿Hay alguna manera de convertir este miedo en motivación?",
    "¿Qué me da coraje en los momentos difíciles?",
    "¿Qué actitud me haría sentir orgulloso de mí mismo dentro de un año?",
  ],
  liberacion_reconexion: [
    "¿Qué miedos he superado en la vida que me han hecho más fuerte?",
    "¿Qué necesito perdonar para que este miedo desaparezca?",
    "¿En qué áreas de la vida puedo confiar más y controlar menos?",
    "¿Cómo puedo acogerme en los días en que el miedo regresa?",
    "¿Qué me conecta con mi esencia más allá de mis miedos?",
    "¿Qué verdades sobre mí puedo recordar cuando me siento inseguro?",
    "¿Qué puedo dejar de cargar hoy para sentirme más ligero?",
    "¿Cómo puedo recordar que el miedo es fugaz?",
    "¿Qué imagen o símbolo representa mi coraje?",
    "¿Qué nueva historia quiero contar sobre mí a partir de ahora?",
  ],
};

// ─── Theme tokens — mirrors original THEMES object exactly ───────────────────
const THEMES: Record<GameMode, {
  label: string;
  emoji: string;
  colorPrimary: string;
  colorLight: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  backGradient: string;
  faceGradient: string;
  // selector extras
  selectorGlow: string;
  topBar: string;
  iconBg: string;
  iconBorder: string;
  activeBorder: string;
  activeBg: string;
}> = {
  identificar_miedo: {
    label:         "Identificar el miedo",
    emoji:         "🔍",
    colorPrimary:  "#497554",
    colorLight:    "#95C7A2",
    colorBg:       "#f0f7f1",
    colorBorder:   "#95C7A2",
    colorText:     "#1e3d27",
    backGradient:  "linear-gradient(135deg, #f0f7f1 0%, #d6ecdb 60%, #95C7A2 100%)",
    faceGradient:  "linear-gradient(160deg, #eaf5ec 0%, #ffffff 100%)",
    selectorGlow:  "rgba(73,117,84,.18)",
    topBar:        "linear-gradient(90deg,#95C7A2,#497554)",
    iconBg:        "#f0f7f1",
    iconBorder:    "#b8dfc0",
    activeBorder:  "#497554",
    activeBg:      "#f0f7f1",
  },
  cuestionando_miedo: {
    label:         "Cuestionando el miedo",
    emoji:         "🤔",
    colorPrimary:  "#5a9467",
    colorLight:    "#95C7A2",
    colorBg:       "#f4faf5",
    colorBorder:   "#7cbf8b",
    colorText:     "#1e4029",
    backGradient:  "linear-gradient(135deg, #f4faf5 0%, #c5e5cc 60%, #7cbf8b 100%)",
    faceGradient:  "linear-gradient(160deg, #eef8f0 0%, #ffffff 100%)",
    selectorGlow:  "rgba(90,148,103,.18)",
    topBar:        "linear-gradient(90deg,#95C7A2,#5a9467)",
    iconBg:        "#f4faf5",
    iconBorder:    "#b8dfc0",
    activeBorder:  "#5a9467",
    activeBg:      "#f4faf5",
  },
  reencuadre: {
    label:         "Reencuadre",
    emoji:         "🔮",
    colorPrimary:  "#C34FC9",
    colorLight:    "#d97dde",
    colorBg:       "#fdf3fe",
    colorBorder:   "#d97dde",
    colorText:     "#5c1860",
    backGradient:  "linear-gradient(135deg, #fdf3fe 0%, #f0c4f3 60%, #d97dde 100%)",
    faceGradient:  "linear-gradient(160deg, #fdf0fe 0%, #ffffff 100%)",
    selectorGlow:  "rgba(195,79,201,.18)",
    topBar:        "linear-gradient(90deg,#d97dde,#C34FC9)",
    iconBg:        "#fdf3fe",
    iconBorder:    "#ebb8ef",
    activeBorder:  "#C34FC9",
    activeBg:      "#fdf3fe",
  },
  accion_confrontacion: {
    label:         "Acción y confrontación",
    emoji:         "⚡",
    colorPrimary:  "#E87F23",
    colorLight:    "#f0a05a",
    colorBg:       "#fff6ee",
    colorBorder:   "#f0a05a",
    colorText:     "#7a3500",
    backGradient:  "linear-gradient(135deg, #fff6ee 0%, #ffd4a8 60%, #f0a05a 100%)",
    faceGradient:  "linear-gradient(160deg, #fff3ea 0%, #ffffff 100%)",
    selectorGlow:  "rgba(232,127,35,.18)",
    topBar:        "linear-gradient(90deg,#f0a05a,#E87F23)",
    iconBg:        "#fff6ee",
    iconBorder:    "#ffd4a8",
    activeBorder:  "#E87F23",
    activeBg:      "#fff6ee",
  },
  liberacion_reconexion: {
    label:         "Liberación y reconexión",
    emoji:         "✨",
    colorPrimary:  "#c8c800",
    colorLight:    "#e8e820",
    colorBg:       "#fefef0",
    colorBorder:   "#e0e020",
    colorText:     "#555500",
    backGradient:  "linear-gradient(135deg, #fefef0 0%, #f5f590 60%, #e8e820 100%)",
    faceGradient:  "linear-gradient(160deg, #fefee8 0%, #ffffff 100%)",
    selectorGlow:  "rgba(200,200,0,.18)",
    topBar:        "linear-gradient(90deg,#e8e820,#c8c800)",
    iconBg:        "#fefef0",
    iconBorder:    "#f0f090",
    activeBorder:  "#c8c800",
    activeBg:      "#fefef0",
  },
};

const MODE_LIST = Object.entries(THEMES).map(([id, t]) => ({
  id: id as GameMode,
  label: t.label,
  emoji: t.emoji,
}));

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
  const pool = QuestionSets[mode];
  return shuffle(pool)
    .slice(0, 20)
    .map((q, i) => ({
      id: `${mode}-${i}-${q.slice(0, 14)}`,
      question: q,
      number: i + 1,
      isFlipped: false,
    }));
}

// ─── ModeCard ─────────────────────────────────────────────────────────────────
function ModeCard({
  modeId, label, emoji, selected, onSelect,
}: {
  modeId: GameMode; label: string; emoji: string;
  selected: boolean; onSelect: () => void;
}) {
  const t = THEMES[modeId];
  return (
    <label style={{
      position: "relative",
      cursor: "pointer",
      display: "block",
      borderRadius: 16,
      border: `1.5px solid ${selected ? t.activeBorder : "#e5e7eb"}`,
      background: selected ? t.activeBg : "#fff",
      boxShadow: selected
        ? `0 0 0 3px ${t.selectorGlow}, 0 4px 16px rgba(0,0,0,.08)`
        : "0 1px 3px rgba(0,0,0,.06)",
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

      <input
        type="radio" name="fears-mode" value={modeId} checked={selected}
        onChange={onSelect}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />

      {/* Inner */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "16px 10px 14px", gap: 8,
      }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: "1.4rem", lineHeight: 1,
          background: t.iconBg, border: `1.5px solid ${t.iconBorder}`,
          transition: "transform .2s",
          transform: selected ? "scale(1.08)" : "scale(1)",
        }}>
          {emoji}
        </div>
        {/* Label */}
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#111827", letterSpacing: "-0.01em", lineHeight: 1.25 }}>
          {label}
        </span>
        {/* Check */}
        <svg viewBox="0 0 20 20" fill="none"
          style={{ width: 18, height: 18, color: t.colorPrimary, opacity: selected ? 1 : 0, transition: "opacity .2s", flexShrink: 0 }}>
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}

// ─── GameCard ─────────────────────────────────────────────────────────────────
function GameCard({ card, mode, delay, onToggle }: {
  card: CardData; mode: GameMode; delay: number; onToggle: (id: string) => void;
}) {
  const t = THEMES[mode];
  return (
    <div style={{ perspective: "900px", animationDelay: `${delay}s`, animation: "fearCardAppear 0.35s ease both" }}>
      <div
        onClick={() => onToggle(card.id)}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "2 / 3",
          cursor: "pointer",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease",
          transform: card.isFlipped ? "rotateY(180deg) translateY(-4px)" : "translateY(0)",
          borderRadius: 14,
          userSelect: "none",
          boxShadow: card.isFlipped ? "0 8px 28px rgba(0,0,0,0.14)" : undefined,
        }}
      >
        {/* ── Back ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden", gap: 6,
          background: t.backGradient,
          border: `2px solid ${t.colorBorder}`,
          color: t.colorText,
          fontWeight: 800, letterSpacing: "-0.03em",
        }}>
          {/* corner star */}
          <span style={{ position: "absolute", top: 8, left: 10, fontSize: "0.55rem", opacity: 0.3 }}>✦</span>
          <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: "0.55rem", opacity: 0.3, transform: "rotate(180deg)" }}>✦</span>
          <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{t.emoji}</span>
          <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>{card.number}</span>
        </div>

        {/* ── Face ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden", padding: "12px 10px", textAlign: "center", gap: 6,
          background: t.faceGradient,
          border: `2px solid ${t.colorBorder}`,
          color: t.colorText,
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
            {card.question}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MiedosGame() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);

  const handleModeSelect = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    setCards(generateCards(mode));
  }, []);

  const handleCardToggle = useCallback((id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: !c.isFlipped } : c)));
  }, []);

  return (
    <>
      <style>{`
        @keyframes fearCardAppear {
          from { opacity: 0; transform: translateY(14px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fearFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Mode grid — 5 cols desktop, 3 mobile */
        .fears-mode-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          padding: 0 20px;
          max-width: 900px;
          margin: 0 auto 32px;
          animation: fearFadeUp 0.4s ease both;
        }
        @media (max-width: 700px) {
          .fears-mode-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }
        @media (max-width: 420px) {
          .fears-mode-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
        /* Card grid — mirrors original */
        .fears-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          padding: 20px 4px 40px;
        }
        @media (max-width: 600px) {
          .fears-cards-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
        }
        @media (max-width: 400px) {
          .fears-cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
        }
        .fears-game-area {
          margin-top: 20px;
          padding: 0 20px 40px;
          width: 100%;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
          overflow-x: hidden;
          animation: fearFadeUp 0.4s 0.1s ease both;
        }
      `}</style>

      <div style={{ background: "#fff", padding: "40px 0 60px", marginTop: 24, borderRadius: 20, overflow: "hidden" }}>

        {/* ── Mode selector ── */}
        <div className="fears-mode-grid">
          {MODE_LIST.map(({ id, label, emoji }) => (
            <ModeCard
              key={id} modeId={id} label={label} emoji={emoji}
              selected={selectedMode === id}
              onSelect={() => handleModeSelect(id)}
            />
          ))}
        </div>

        {/* ── Cards ── */}
        <div className="fears-game-area">
          {!selectedMode ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "56px 24px", gap: 12,
              color: "#9ca3af", textAlign: "center",
            }}>
              <span style={{ fontSize: "3rem", lineHeight: 1, opacity: 0.45 }}>🃏</span>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Elige una categoría arriba<br />para comenzar tu exploración
              </p>
            </div>
          ) : (
            <div className="fears-cards-grid">
              {cards.map((card, idx) => (
                <GameCard
                  key={card.id} card={card} mode={selectedMode}
                  delay={idx * 0.028} onToggle={handleCardToggle}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}