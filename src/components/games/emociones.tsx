import { useState, useEffect, useRef } from "react";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap";
document.head.appendChild(fontLink);

// ─── Theme config ─────────────────────────────────────────────────────────────
const THEMES = {
  tristeza: {
    name: "Tristeza",
    charName: "Melancolía",
    gradient: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #e0f2fe 100%)",
    cardGrad: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    pillActive: "#2563eb",
    pillActiveBg: "#dbeafe",
    pillActiveText: "#1e40af",
    accent: "#3b82f6",
    accentLight: "#bfdbfe",
    textDark: "#1e3a5f",
    bubbleColor: "rgba(59,130,246,0.12)",
    emoji: "😔",
    tagline: "Sentir es parte de sanar",
  },
  alegria: {
    name: "Alegría",
    charName: "Brillo",
    gradient: "linear-gradient(135deg, #fef9c3 0%, #fffbeb 50%, #fef3c7 100%)",
    cardGrad: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    pillActive: "#d97706",
    pillActiveBg: "#fef3c7",
    pillActiveText: "#92400e",
    accent: "#f59e0b",
    accentLight: "#fde68a",
    textDark: "#78350f",
    bubbleColor: "rgba(245,158,11,0.12)",
    emoji: "😄",
    tagline: "La alegría es contagiosa",
  },
  enfado: {
    name: "Enfado",
    charName: "Fuego",
    gradient: "linear-gradient(135deg, #fee2e2 0%, #fff1f2 50%, #fce7f3 100%)",
    cardGrad: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    pillActive: "#dc2626",
    pillActiveBg: "#fee2e2",
    pillActiveText: "#991b1b",
    accent: "#ef4444",
    accentLight: "#fecaca",
    textDark: "#7f1d1d",
    bubbleColor: "rgba(239,68,68,0.12)",
    emoji: "😡",
    tagline: "Nombrar la ira la transforma",
  },
  amor: {
    name: "Amor",
    charName: "Ternura",
    gradient: "linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #f5d0fe 100%)",
    cardGrad: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    pillActive: "#db2777",
    pillActiveBg: "#fce7f3",
    pillActiveText: "#831843",
    accent: "#ec4899",
    accentLight: "#fbcfe8",
    textDark: "#831843",
    bubbleColor: "rgba(236,72,153,0.12)",
    emoji: "🫶",
    tagline: "El amor también es hacia ti",
  },
  miedo: {
    name: "Miedo",
    charName: "Sombra",
    gradient: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 50%, #e0e7ff 100%)",
    cardGrad: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    pillActive: "#6d28d9",
    pillActiveBg: "#ede9fe",
    pillActiveText: "#4c1d95",
    accent: "#7c3aed",
    accentLight: "#ddd6fe",
    textDark: "#3b0764",
    bubbleColor: "rgba(124,58,237,0.12)",
    emoji: "😨",
    tagline: "El miedo también te cuida",
  },
  sorpresa: {
    name: "Sorpresa",
    charName: "Chispa",
    gradient: "linear-gradient(135deg, #fed7aa 0%, #fff7ed 50%, #fef3c7 100%)",
    cardGrad: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    pillActive: "#ea580c",
    pillActiveBg: "#fed7aa",
    pillActiveText: "#9a3412",
    accent: "#f97316",
    accentLight: "#fdba74",
    textDark: "#7c2d12",
    bubbleColor: "rgba(249,115,22,0.12)",
    emoji: "😲",
    tagline: "Lo inesperado abre puertas",
  },
  asco: {
    name: "Asco",
    charName: "Bruma",
    gradient: "linear-gradient(135deg, #d1fae5 0%, #f0fdf4 50%, #dcfce7 100%)",
    cardGrad: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    pillActive: "#059669",
    pillActiveBg: "#d1fae5",
    pillActiveText: "#065f46",
    accent: "#10b981",
    accentLight: "#a7f3d0",
    textDark: "#064e3b",
    bubbleColor: "rgba(16,185,129,0.12)",
    emoji: "🤢",
    tagline: "Rechazar también es elegir",
  },
};

// ─── Emotion data ─────────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: "tristeza",
    emoji: "😔",
    name: "Tristeza",
    desc: "Pena · Vacío · Nostalgia",
    emociones: ["Abandono","Abatimiento","Aflicción","Agobio","Amargura","Apatía","Arrepentimiento","Congoja","Culpa","Decepción","Depresión","Derrota","Desaliento","Desánimo","Desconsuelo","Desesperanza","Desilusión","Desolación","Dolor","Duelo","Fracaso","Humillación","Melancolía","Nostalgia","Pena","Pesimismo","Remordimiento","Resignación","Soledad","Vacío"],
  },
  {
    id: "alegria",
    emoji: "😄",
    name: "Alegría",
    desc: "Gozo · Entusiasmo · Plenitud",
    emociones: ["Alivio","Ánimo","Bienestar","Calma","Contento","Deleite","Dicha","Disfrute","Diversión","Entusiasmo","Esperanza","Euforia","Felicidad","Gozo","Ilusión","Inspiración","Júbilo","Motivación","Optimismo","Pasión","Placer","Plenitud","Satisfacción","Tranquilidad","Triunfo","Vivacidad"],
  },
  {
    id: "enfado",
    emoji: "😡",
    name: "Enfado",
    desc: "Ira · Frustración · Rabia",
    emociones: ["Agresividad","Cólera","Coraje","Despecho","Disgusto","Enojo","Envidia","Estrés","Exasperación","Fastidio","Frustración","Furia","Hostilidad","Impaciencia","Indignación","Ira","Irritabilidad","Malhumor","Molestia","Odio","Rabia","Rencor","Resentimiento","Traición","Venganza"],
  },
  {
    id: "amor",
    emoji: "🫶",
    name: "Amor",
    desc: "Afecto · Empatía · Conexión",
    emociones: ["Aceptación","Admiración","Adoración","Afecto","Agradecimiento","Amabilidad","Apego","Apoyo","Atracción","Bondad","Cariño","Compasión","Comprensión","Confianza","Cuidado","Deseo","Empatía","Generosidad","Gratitud","Intimidad","Paciencia","Paz","Respeto","Seguridad","Ternura"],
  },
  {
    id: "miedo",
    emoji: "😨",
    name: "Miedo",
    desc: "Ansiedad · Inseguridad · Pavor",
    emociones: ["Alarma","Angustia","Ansiedad","Aprensión","Cautela","Desasosiego","Desconfianza","Espanto","Fobia","Horror","Indefensión","Inseguridad","Inquietud","Intimidación","Nerviosismo","Pánico","Pavor","Preocupación","Susto","Temor","Terror","Timidez","Vergüenza","Vulnerabilidad"],
  },
  {
    id: "sorpresa",
    emoji: "😲",
    name: "Sorpresa",
    desc: "Asombro · Confusión · Duda",
    emociones: ["Alteración","Ambivalencia","Asombro","Aturdimiento","Confusión","Curiosidad","Desconcierto","Duda","Estupefacción","Expectación","Extrañeza","Impacto","Incredulidad","Intriga","Maravilla","Pasmo","Perplejidad","Shock","Sobresalto","Vacilación"],
  },
  {
    id: "asco",
    emoji: "🤢",
    name: "Asco",
    desc: "Rechazo · Aversión · Repulsión",
    emociones: ["Aborrecimiento","Antipatía","Aversión","Censura","Desagrado","Desprecio","Distanciamiento","Grima","Hastío","Intolerancia","Náusea","Rechazo","Repudio","Repugnancia","Repulsión"],
  },
];

const NEEDS = {
  tristeza: "Permítete sentir sin juzgarte. Busca un espacio seguro o alguien que te escuche con calma.",
  alegria: "Comparte este momento. La alegría multiplica cuando se regala.",
  enfado: "Respira antes de actuar. Tu energía puede ser límite o mensaje.",
  amor: "Exprésalo. El afecto guardado pierde su magia.",
  miedo: "Nombra exactamente qué temes. La precisión reduce el pánico.",
  sorpresa: "Date tiempo. No todo necesita respuesta inmediata.",
  asco: "Escúchate: tu rechazo señala algo que importa.",
};


function Blobs({ theme }) {
  const t = THEMES[theme] || {};
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: t.bubbleColor || "rgba(200,200,200,0.1)",
        top: -100, right: -80, filter: "blur(60px)",
        animation: "blob1 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 320, height: 320, borderRadius: "50%",
        background: t.bubbleColor || "rgba(200,200,200,0.08)",
        bottom: -60, left: -60, filter: "blur(50px)",
        animation: "blob2 10s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step, total = 4 }) {
  const labels = ["Emoción", "Matices", "Intensidad", "Insight"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < total - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < step ? "#1a1a2e" : i === step ? "#1a1a2e" : "transparent",
              border: i <= step ? "2px solid #1a1a2e" : "2px solid #d1d5db",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              color: i <= step ? "#fff" : "#9ca3af",
              transition: "all 0.4s ease",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 500, color: i <= step ? "#374151" : "#9ca3af",
              fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
              transition: "color 0.4s",
            }}>{label}</span>
          </div>
          {i < total - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 8px", marginBottom: 18,
              background: i < step ? "#1a1a2e" : "#e5e7eb",
              transition: "background 0.4s",
              borderRadius: 2,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 0 — Categoría ───────────────────────────────────────────────────────
function StepCategoria({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [pressed, setPressed] = useState(null);

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Bienestar emocional
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 600, color: "#111827", lineHeight: 1.2, margin: 0 }}>
          ¿Cómo estás<br /><em style={{ fontWeight: 400 }}>ahora mismo?</em>
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#6b7280", marginTop: 10 }}>
          Elige la emoción más cercana a lo que sientes.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {CATEGORIAS.map((cat, idx) => {
          const t = THEMES[cat.id];
          const isHov = hovered === cat.id;
          const isPress = pressed === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={() => setPressed(cat.id)}
              onMouseUp={() => setPressed(null)}
              style={{
                background: isHov ? t.gradient : "#fff",
                border: isHov ? `2px solid ${t.accentLight}` : "2px solid #f3f4f6",
                borderRadius: 20, padding: "20px 16px", cursor: "pointer", textAlign: "left",
                transform: isHov ? "translateY(-4px) scale(1.02)" : isPress ? "scale(0.97)" : "none",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: isHov ? `0 12px 32px ${t.bubbleColor}, 0 2px 8px rgba(0,0,0,0.06)` : "0 2px 8px rgba(0,0,0,0.04)",
                animation: `fadeUp 0.4s ease ${idx * 0.05}s both`,
                outline: "none",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>{cat.emoji}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: isHov ? t.textDark : "#1f2937", marginBottom: 4 }}>
                {cat.name}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>
                {cat.desc}
              </div>
              {isHov && (
                <div style={{ marginTop: 12, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: t.accent }}>
                  Explorar →
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1 — Subemociones ────────────────────────────────────────────────────
function StepEmociones({ cat, selected, onToggle, onBack, onNext }) {
  const t = THEMES[cat.id];
  return (
    <div style={{ animation: "fadeUp 0.4s ease", display: "flex", flexDirection: "column", height: "100%" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9ca3af", padding: "0 0 20px 0", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
        ← Volver
      </button>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: t.gradient,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          boxShadow: `0 4px 16px ${t.bubbleColor}`,
        }}>
          {cat.emoji}
        </div>
        <div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
            {cat.name}
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, color: "#111827", margin: "2px 0 0" }}>
            ¿Qué palabras resuenan?
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < selected.length ? t.accent : "#e5e7eb",
              transition: "background 0.3s ease",
            }} />
          ))}
        </div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9ca3af" }}>
          {selected.length === 0 ? "Elige hasta 3" : `${selected.length} de 3 elegidas`}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, overflowY: "auto", flex: 1, paddingBottom: 16 }}>
        {cat.emociones.map((e) => {
          const isActive = selected.includes(e);
          const disabled = !isActive && selected.length >= 3;
          return (
            <button
              key={e}
              onClick={() => onToggle(e)}
              disabled={disabled}
              style={{
                padding: "8px 18px", borderRadius: 100,
                background: isActive ? t.pillActiveBg : "#f9fafb",
                border: isActive ? `2px solid ${t.accentLight}` : "2px solid transparent",
                color: isActive ? t.pillActiveText : "#374151",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: isActive ? 500 : 400,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.35 : 1,
                transform: isActive ? "scale(1.05)" : "scale(1)",
                boxShadow: isActive ? `0 4px 12px ${t.bubbleColor}` : "none",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                outline: "none",
              }}
            >
              {isActive && <span style={{ marginRight: 4 }}>✓</span>}
              {e}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selected.length === 0}
        style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: selected.length > 0 ? t.cardGrad : "#f3f4f6",
          color: selected.length > 0 ? "#fff" : "#d1d5db",
          border: "none", cursor: selected.length > 0 ? "pointer" : "not-allowed",
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
          boxShadow: selected.length > 0 ? `0 6px 20px ${t.bubbleColor}` : "none",
          transition: "all 0.3s ease", marginTop: 8,
        }}
      >
        Continuar →
      </button>
    </div>
  );
}

// ─── Step 2 — Emoción principal ───────────────────────────────────────────────
function StepPrincipal({ cat, selected, principal, onSelect, onBack, onNext }) {
  const t = THEMES[cat.id];
  return (
    <div style={{ animation: "fadeUp 0.4s ease", display: "flex", flexDirection: "column", height: "100%" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#9ca3af", padding: "0 0 20px 0", textAlign: "left" }}>
        ← Volver
      </button>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
          Paso final
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 600, color: "#111827", margin: "4px 0 6px" }}>
          ¿Cuál es la más intensa?
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6b7280", margin: 0 }}>
          La que más espacio ocupa ahora mismo.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {selected.map((e, i) => {
          const isActive = principal === e;
          return (
            <button
              key={e}
              onClick={() => onSelect(e)}
              style={{
                padding: "20px 24px", borderRadius: 18, textAlign: "left", cursor: "pointer",
                background: isActive ? t.gradient : "#fafafa",
                border: isActive ? `2px solid ${t.accentLight}` : "2px solid #f3f4f6",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                boxShadow: isActive ? `0 8px 28px ${t.bubbleColor}` : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                outline: "none",
                animation: `fadeUp 0.3s ease ${i * 0.08}s both`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600,
                  color: isActive ? t.textDark : "#374151",
                }}>{e}</span>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: isActive ? t.accent : "transparent",
                  border: isActive ? "none" : `2px solid #d1d5db`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s ease",
                }}>
                  {isActive && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                </div>
              </div>
              {isActive && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: t.accent, margin: "6px 0 0", fontStyle: "italic" }}>
                  {t.tagline}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!principal}
        style={{
          width: "100%", padding: "14px", borderRadius: 14, marginTop: 16,
          background: principal ? t.cardGrad : "#f3f4f6",
          color: principal ? "#fff" : "#d1d5db",
          border: "none", cursor: principal ? "pointer" : "not-allowed",
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
          boxShadow: principal ? `0 6px 20px ${t.bubbleColor}` : "none",
          transition: "all 0.3s ease",
        }}
      >
        Ver mi insight →
      </button>
    </div>
  );
}

// ─── Step 3 — Resultado ───────────────────────────────────────────────────────
function StepResultado({ cat, principal, seleccionadas, onReiniciar }) {
  const t = THEMES[cat.id];
  const [reflexion, setReflexion] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ animation: "fadeUp 0.5s ease", display: "flex", flexDirection: "column", height: "100%", gap: 16 }}>
      <div style={{
        background: t.gradient,
        borderRadius: 24, padding: "28px 28px 24px", position: "relative", overflow: "hidden",
        boxShadow: `0 12px 40px ${t.bubbleColor}`,
      }}>
        <div style={{
          position: "absolute", right: -20, top: -20,
          fontSize: 140, opacity: 0.07, lineHeight: 1,
          filter: "blur(2px)",
          userSelect: "none",
        }}>{cat.emoji}</div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: t.accent, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                Tu insight de hoy
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 600, color: t.textDark, margin: 0, lineHeight: 1 }}>
                  {principal}
                </h2>
              </div>
            </div>
          </div>

          {seleccionadas.filter(e => e !== principal).length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {seleccionadas.filter(e => e !== principal).map(e => (
                <span key={e} style={{
                  padding: "4px 12px", borderRadius: 100,
                  background: "rgba(255,255,255,0.5)",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: t.textDark,
                  backdropFilter: "blur(4px)",
                }}>
                  {e}
                </span>
              ))}
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: t.accent, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ¿Qué podrías necesitar?
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: t.textDark, margin: 0, lineHeight: 1.6 }}>
              {NEEDS[cat.id]}
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          ¿Qué detonó esta emoción? <span style={{ color: "#9ca3af" }}>(opcional)</span>
        </p>
        <textarea
          value={reflexion}
          onChange={e => setReflexion(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Escribe aquí si quieres reflexionar..."
          style={{
            flex: 1, minHeight: 100, padding: "14px 16px", borderRadius: 14,
            border: focused ? `2px solid ${t.accentLight}` : "2px solid #f3f4f6",
            background: focused ? "rgba(255,255,255,0.9)" : "#fafafa",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#374151",
            resize: "none", outline: "none",
            boxShadow: focused ? `0 4px 16px ${t.bubbleColor}` : "none",
            transition: "all 0.25s ease",
            backdropFilter: "blur(4px)",
          }}
        />
      </div>

      <button
        onClick={onReiniciar}
        style={{
          width: "100%", padding: "13px", borderRadius: 14,
          background: "transparent", border: "2px solid #f3f4f6",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6b7280",
          cursor: "pointer", transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.color = "#374151"; }}
        onMouseLeave={e => { e.target.style.borderColor = "#f3f4f6"; e.target.style.color = "#6b7280"; }}
      >
        ↩ Nuevo registro
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MoodTracker() {
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(null);
  const [selected, setSelected] = useState([]);
  const [principal, setPrincipal] = useState(null);

  const bgTheme = cat ? cat.id : null;
  const t = bgTheme ? THEMES[bgTheme] : null;

  const handleSelectCat = (c) => {
    setCat(c); setSelected([]); setPrincipal(null); setStep(1);
  };
  const handleToggle = (e) => {
    setSelected(prev => prev.includes(e) ? prev.filter(x => x !== e) : prev.length < 3 ? [...prev, e] : prev);
  };
  const handleReiniciar = () => {
    setCat(null); setSelected([]); setPrincipal(null); setStep(0);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 10px) scale(0.95); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.08); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: t ? t.gradient : "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        transition: "background 0.6s ease",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px", position: "relative",
      }}>
        {bgTheme && <Blobs theme={bgTheme} />}

        <div style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          borderRadius: 28,
          width: "100%", maxWidth: 720,
          minHeight: "calc(100vh - 48px)",
          display: "flex", flexDirection: "column",
          boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          padding: "40px 44px 36px",
          position: "relative", zIndex: 1,
          overflow: "hidden",
        }}>
          <StepBar step={step} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {step === 0 && <StepCategoria onSelect={handleSelectCat} />}
            {step === 1 && cat && (
              <StepEmociones cat={cat} selected={selected} onToggle={handleToggle} onBack={() => setStep(0)} onNext={() => setStep(2)} />
            )}
            {step === 2 && cat && (
              <StepPrincipal cat={cat} selected={selected} principal={principal} onSelect={setPrincipal} onBack={() => setStep(1)} onNext={() => setStep(3)} />
            )}
            {step === 3 && cat && principal && (
              <StepResultado cat={cat} principal={principal} seleccionadas={selected} onReiniciar={handleReiniciar} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}