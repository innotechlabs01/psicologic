const QuestionKiss = [
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

const QuestionFire = [
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

const QuestionTruth = [
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

// ─── Inject styles ────────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('cartas-styles')) return;
  const style = document.createElement('style');
  style.id = 'cartas-styles';
  style.textContent = `
    /* ── Card Grid ── */
    #game {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 14px;
      padding: 20px 4px 40px;
    }

    @media (max-width: 480px) {
      #game {
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
    }

    /* ── Card wrapper (perspective container) ── */
    #game > div {
      perspective: 900px;
    }

    /* ── Card base ── */
    .card {
      position: relative;
      width: 100%;
      aspect-ratio: 2 / 3;
      cursor: pointer;
      transform-style: preserve-3d;
      transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
      border-radius: 14px;
      user-select: none;
    }

    .card:hover {
      box-shadow: 0 8px 28px rgba(0,0,0,0.16);
      transform: translateY(-3px);
    }

    .card.flip {
      transform: rotateY(180deg) translateY(-3px);
    }

    /* ── Back & Face shared ── */
    .card .back,
    .card .face {
      position: absolute;
      inset: 0;
      border-radius: 14px;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* ── Back (number side) ── */
    .card .back {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      border: 2px solid transparent;
      gap: 6px;
    }

    .card.besos .back {
      background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 60%, #fbcfe8 100%);
      border-color: #f9a8d4;
      color: #be185d;
    }
    .card.fuego .back {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%);
      border-color: #fb923c;
      color: #c2410c;
    }
    .card.rayo .back {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 60%, #c7d2fe 100%);
      border-color: #818cf8;
      color: #4338ca;
    }

    .card .back img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      opacity: 0.9;
    }

    .card .back .card-number {
      font-size: 1.25rem;
      font-weight: 700;
    }

    /* Decorative corner dots */
    .card .back::before,
    .card .back::after {
      content: '♥';
      position: absolute;
      font-size: 0.6rem;
      opacity: 0.35;
    }
    .card .back::before { top: 8px; left: 10px; }
    .card .back::after  { bottom: 8px; right: 10px; transform: rotate(180deg); }

    /* ── Face (question side) ── */
    .card .face {
      transform: rotateY(180deg);
      padding: 12px 10px;
      text-align: center;
      gap: 6px;
    }

    .card.besos .face {
      background: linear-gradient(160deg, #fff0f8 0%, #ffffff 100%);
      border: 2px solid #f9a8d4;
      color: #831843;
    }
    .card.fuego .face {
      background: linear-gradient(160deg, #fffbf5 0%, #ffffff 100%);
      border: 2px solid #fb923c;
      color: #9a3412;
    }
    .card.rayo .face {
      background: linear-gradient(160deg, #f5f6ff 0%, #ffffff 100%);
      border: 2px solid #818cf8;
      color: #3730a3;
    }

    .card .face .face-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.6;
      line-height: 1.2;
    }

    .card .face .face-question {
      font-size: 0.72rem;
      font-weight: 500;
      line-height: 1.45;
    }

    /* ── Empty state ── */
    .game-empty {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 56px 24px;
      gap: 12px;
      color: #9ca3af;
      text-align: center;
    }

    .game-empty-icon {
      font-size: 3rem;
      line-height: 1;
      opacity: 0.5;
    }

    .game-empty-text {
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* ── Fade-in cards ── */
    @keyframes cardAppear {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    #game > div {
      animation: cardAppear 0.35s ease both;
    }
  `;
  document.head.appendChild(style);
}

// ─── State ────────────────────────────────────────────────────────────────────
const totalCards = 20;
const selecciones = [];
let cards = [];
let valuesUsed = [];
let currentMove = 0;
let currentAttempts = 0;
let socket = null;

// ─── Setup cards ──────────────────────────────────────────────────────────────
function setupCards(gameType = 'besos') {
  const gameDiv = document.getElementById('game');
  if (!gameDiv) { showError('Error: No se encontró el contenedor del juego.'); return; }

  gameDiv.innerHTML = '';
  cards = [];
  valuesUsed = [];
  currentMove = 0;
  currentAttempts = 0;
  selecciones.length = 0;

  // Show empty state until a mode is selected — but here gameType is always set
  const cardValues = generateCardValues(gameType);

  cardValues.forEach(({ question, number }, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.animationDelay = `${idx * 0.03}s`;

    const card = document.createElement('div');
    card.className = `card ${gameType}`;
    card.dataset.cartaId = question.question || question.title || String(number);

    card.innerHTML = `
      <div class="back">
        <img src="/img/${gameType}.svg" alt="${gameType}" onerror="this.style.display='none'">
        <span class="card-number">${number}</span>
      </div>
        <div class="face flex flex-col items-center justify-center p-2 text-center">
          ${question.title ? `<h3 class="text-md font-bold mb-2 text-yellow-600">${question.title}</h3>` : ""}
          <p class="text-sm">${question.question}</p>
        </div>
    `;

    card.addEventListener('click', (e) => activate(e));
    wrapper.appendChild(card);
    cards.push(wrapper);
    gameDiv.appendChild(wrapper);
    console.log('hola')
  });
}

// ─── Generate values ──────────────────────────────────────────────────────────
function generateCardValues(gameType) {
  let available = [];
  if (gameType === 'besos') {
    available = QuestionKiss.map(q => ({ title: null, question: q }));
  } else if (gameType === 'fuego') {
    available = QuestionFire.map(q => ({ title: null, question: q }));
  } else if (gameType === 'rayo') {
    available = [...QuestionTruth];
  }

  // Fisher–Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  return available.slice(0, totalCards).map((q, i) => ({ question: q, number: i + 1 }));
}

// ─── Activate card ────────────────────────────────────────────────────────────
function activate(e) {
  const card = e.currentTarget;
  const isFlipped = card.classList.toggle('flip');
  const cartaName = card.dataset.cartaId;

  if (isFlipped) {
    currentMove++;
    selecciones.push(cartaName);
  } else {
    currentMove--;
    const index = selecciones.indexOf(cartaName);
    if (index !== -1) selecciones.splice(index, 1);
  }
}

// ─── Error display ────────────────────────────────────────────────────────────
function showError(message) {
  const errorDiv = document.getElementById('error');
  if (errorDiv) errorDiv.textContent = message;
}

// ─── Radio buttons ────────────────────────────────────────────────────────────
function setupClickRadioButton() {
  const radios = document.querySelectorAll('input[name="list-radio"]');

  radios.forEach(radio => {
    radio.removeEventListener('change', handleRadioChange);
    radio.addEventListener('change', handleRadioChange);
  });
}

function handleRadioChange(e) {
  setupCards(e.target.value);
}

// ─── Show empty state before selection ───────────────────────────────────────
function showEmptyState() {
  const gameDiv = document.getElementById('game');
  if (!gameDiv) return;
  gameDiv.innerHTML = `
    <div class="game-empty">
      <div class="game-empty-icon">🃏</div>
      <p class="game-empty-text">Elige una categoría arriba<br>para empezar a jugar</p>
    </div>
  `;
}

// ─── Initialize ───────────────────────────────────────────────────────────────
function initializeCartas() {
  injectStyles();
  showEmptyState();
  setupClickRadioButton();
}

/* ---------- INIT ---------- */

function init() {
  initializeCartas();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

/* Astro navigation fix */

document.addEventListener("astro:page-load", init);