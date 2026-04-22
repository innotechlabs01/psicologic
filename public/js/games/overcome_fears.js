const QuestionSets = {
  "identificar_miedo": [
    "¿Qué miedo es el que más me impide avanzar hoy?",
    "¿Qué dice este miedo de mi?",
    "¿Cuando fue la primera vez que senti este miedo?",
    "¿Qué evito por este miedo?",
    "¿Cómo reacciona mi cuerpo cuando tengo miedo?",
    "¿Cuándo aparece con mayor fuerza este miedo?",
    "¿Qué creo que pasará si me enfrento a este miedo?",
    "¿Qué estoy tratando de proteger al sentir este miedo?",
    "¿Este miedo me pertenece o aprendi a sentirlo de alguien?",
    "¿Cómo me trato cuando siento miedo?"
  ],
  "cuestionando_miedo": [
    "¿Este miedo se basa en hechos o en suposiciones?",
    "¿Qué le diria a un amigo que sentiera el mismo miedo?",
    "¿Qué es lo peor que podría pasar? ¿Podría soportar eso?",
    "¿Cuáles son los posibilidades reales de que este miedo se haga realidad?",
    "¿Qué he hecho para mantener vivo este miedo?",
    "¿Este miedo me protege o me limita?",
    "Si este miedo tuvera voz ¿Qué diria?",
    "¿Qué creencias hay detrás de este miedo?",
    "¿Me he enfrentado a algo parecido antes? ¿Cómo fue?",
    "¿Qué evidencia tengo de que puedo manejar eso?"
  ],
  "reencuadre": [
    "¿Qué podria este miedo estar intentando enseñarme?",
    "¿Qué aprendazaje hay detrás de este malestar?",
    "¿Qué parte de mí necesita ser fortalecida para superar este miedo?",
    "Si actuara con valentía, ¿Qué haría hoy?",
    "¿Quién seria yo sin este miedo?",
    "¿Qué oportunidades estoy perdiendo al darle espacio a este miedo?",
    "¿Cómo seria afrontar ese miedo con amabilidad y no con presión?",
    "¿Qué puedo hacer ahora mismo para sentirme un 5% más seguro?",
    "¿Quién me inspira a actuar con valentía?",
    "¿Qué frase puedo repetirme cuando este miedo aparece?"
  ],
  "accion_confrontacion": [
    "¿Cuál es el primer paso (aunque sea pequeño) que puedo dar para afrontar este miedo?",
    "¿Qué me fortalece cuando tengo miedo?",
    "¿Qué tipo de apoyo puedo buscar para afrontar este reto?",
    "¿Qué plan práctico puedo crear para abordar este miedo gradualmente?",
    "¿Cuál es el escenario más realista —ni el peor ni el mejor— para esta situación?",
    "¿Cómo puedo celebrar cada paso adelante, por pequeño que sea?",
    "¿Qué puedo hacer cuando el miedo intenta nuevamente paralizarme?",
    "¿Hay alguna manera de convertir este miedo en motivación?",
    "¿Qué me da coraje en los momentos difíciles?",
    "¿Qué actitud me haría sentir orgulloso de mí mismo dentro de un año?"
  ],
  "liberacion_reconexion": [
    "¿Qué miedos he superado en la vida que me han hecho más fuerte?",
    "¿Qué necesito perdonar para que este miedo desaparezca?",
    "¿En qué áreas de la vida puedo confiar más y controlar menos?",
    "¿Cómo puedo acogerme en los días en que el miedo regresa?",
    "¿Qué me conecta con mi esencia más allá de mis miedos?",
    "¿Qué verdades sobre mí puedo recordar cuando me siento inseguro?",
    "¿Qué puedo dejar de cargar hoy para sentirme más ligero?",
    "¿Cómo puedo recordar que el miedo es fugaz?",
    "¿Qué imagen o símbolo representa mi coraje?",
    "¿Qué nueva historia quiero contar sobre mí a partir de ahora?"
  ]
};

// ─── Theme config per gameType ─────────────────────────────────────────────────
const THEMES = {
  identificar_miedo: {
    label:    'Identificar el miedo',
    emoji:    '🔍',
    colorPrimary: '#497554',
    colorLight:   '#95C7A2',
    colorBg:      '#f0f7f1',
    colorBorder:  '#95C7A2',
    colorText:    '#1e3d27',
    backGradient: 'linear-gradient(135deg, #f0f7f1 0%, #d6ecdb 60%, #95C7A2 100%)',
    faceGradient: 'linear-gradient(160deg, #eaf5ec 0%, #ffffff 100%)',
  },
  cuestionando_miedo: {
    label:    'Cuestionando el miedo',
    emoji:    '🤔',
    colorPrimary: '#5a9467',
    colorLight:   '#95C7A2',
    colorBg:      '#f4faf5',
    colorBorder:  '#7cbf8b',
    colorText:    '#1e4029',
    backGradient: 'linear-gradient(135deg, #f4faf5 0%, #c5e5cc 60%, #7cbf8b 100%)',
    faceGradient: 'linear-gradient(160deg, #eef8f0 0%, #ffffff 100%)',
  },
  reencuadre: {
    label:    'Reencuadre',
    emoji:    '🔮',
    colorPrimary: '#C34FC9',
    colorLight:   '#d97dde',
    colorBg:      '#fdf3fe',
    colorBorder:  '#d97dde',
    colorText:    '#5c1860',
    backGradient: 'linear-gradient(135deg, #fdf3fe 0%, #f0c4f3 60%, #d97dde 100%)',
    faceGradient: 'linear-gradient(160deg, #fdf0fe 0%, #ffffff 100%)',
  },
  accion_confrontacion: {
    label:    'Acción y confrontación',
    emoji:    '⚡',
    colorPrimary: '#E87F23',
    colorLight:   '#f0a05a',
    colorBg:      '#fff6ee',
    colorBorder:  '#f0a05a',
    colorText:    '#7a3500',
    backGradient: 'linear-gradient(135deg, #fff6ee 0%, #ffd4a8 60%, #f0a05a 100%)',
    faceGradient: 'linear-gradient(160deg, #fff3ea 0%, #ffffff 100%)',
  },
  liberacion_reconexion: {
    label:    'Liberación y reconexión',
    emoji:    '✨',
    colorPrimary: '#c8c800',
    colorLight:   '#e8e820',
    colorBg:      '#fefef0',
    colorBorder:  '#e0e020',
    colorText:    '#555500',
    backGradient: 'linear-gradient(135deg, #fefef0 0%, #f5f590 60%, #e8e820 100%)',
    faceGradient: 'linear-gradient(160deg, #fefee8 0%, #ffffff 100%)',
  },
};

// ─── Inject styles ─────────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('fears-card-styles')) return;
  const style = document.createElement('style');
  style.id = 'fears-card-styles';
  style.textContent = `
    /* ── Card Grid ── */
    #game {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 14px;
      padding: 20px 4px 40px;
    }

    @media (max-width: 600px) {
      #game {
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: auto;
        gap: 10px;
      }
    }

    @media (max-width: 400px) {
      #game {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
    }

    /* ── Card wrapper (perspective) ── */
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
      box-shadow: 0 8px 28px rgba(0,0,0,0.14);
      transform: translateY(-4px);
    }

    .card.flip {
      transform: rotateY(180deg) translateY(-4px);
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
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      border: 2px solid transparent;
      gap: 6px;
    }

    /* Decorative corner hearts */
    .card .back::before,
    .card .back::after {
      content: '✦';
      position: absolute;
      font-size: 0.55rem;
      opacity: 0.3;
    }
    .card .back::before { top: 8px; left: 10px; }
    .card .back::after  { bottom: 8px; right: 10px; transform: rotate(180deg); }

    .card .back .card-number {
      font-size: 1.2rem;
      font-weight: 700;
    }

    /* ── Face (question side) ── */
    .card .face {
      transform: rotateY(180deg);
      padding: 12px 10px;
      text-align: center;
      gap: 6px;
      border: 2px solid transparent;
    }

    .card .face .face-question {
      font-size: 0.7rem;
      font-weight: 500;
      line-height: 1.5;
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
      opacity: 0.45;
    }

    .game-empty-text {
      font-size: 0.88rem;
      line-height: 1.6;
    }

    /* ── Fade-in cards ── */
    @keyframes cardAppear {
      from { opacity: 0; transform: translateY(14px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
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
let currentMove = 0;
let currentAttempts = 0;
let socket = null;

const state = {
  users: [],
  currentUserId: null,
  paymentScriptLoaded: false
};

// ─── Setup cards ──────────────────────────────────────────────────────────────
function setupCards(gameType = 'identificar_miedo') {
  const gameDiv = document.getElementById('game');
  if (!gameDiv) { showError('Error: No se encontró el contenedor del juego.'); return; }

  gameDiv.innerHTML = '';
  cards = [];
  currentMove = 0;
  currentAttempts = 0;
  selecciones.length = 0;

  const theme = THEMES[gameType];
  if (!theme) { showError(`Tipo de juego no reconocido: ${gameType}`); return; }

  const cardValues = generateCardValues(gameType);
  if (!cardValues.length) { showError('No hay preguntas para este tipo.'); return; }

  cardValues.forEach(({ question, number }, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.animationDelay = `${idx * 0.028}s`;

    const card = document.createElement('div');
    card.className = `card ${gameType}`;
    card.dataset.cartaId = question;

    card.innerHTML = `
      <div class="back" style="
        background: ${theme.backGradient};
        border-color: ${theme.colorBorder};
        color: ${theme.colorText};
      ">
        <span style="font-size:1.4rem;line-height:1;">${theme.emoji}</span>
        <span class="card-number">${number}</span>
      </div>
      <div class="face" style="
        background: ${theme.faceGradient};
        border-color: ${theme.colorBorder};
        color: ${theme.colorText};
      ">
        <p class="face-question">${question}</p>
      </div>
    `;

    card.addEventListener('click', (e) => activate(e));
    wrapper.appendChild(card);
    cards.push(wrapper);
    gameDiv.appendChild(wrapper);
  });
}

// ─── Generate values ──────────────────────────────────────────────────────────
function generateCardValues(gameType) {
  const questionArray = QuestionSets[gameType];
  if (!questionArray || !questionArray.length) return [];

  // Fisher–Yates shuffle
  const arr = [...questionArray];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const cardsToSelect = Math.min(totalCards, arr.length);
  return arr.slice(0, cardsToSelect).map((question, i) => ({ question, number: i + 1 }));
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

  updateEnviarButton();
}

// ─── Enviar button ────────────────────────────────────────────────────────────
function updateEnviarButton() {
  const enviarBtn = document.getElementById('enviarBtn');
  if (enviarBtn) enviarBtn.disabled = selecciones.length === 0;
}

// ─── Error display ────────────────────────────────────────────────────────────
function showError(message) {
  console.error(message);
  const errorDiv = document.getElementById('error');
  if (errorDiv) errorDiv.textContent = message;
}

// ─── Radio buttons ────────────────────────────────────────────────────────────
// ─── Radio buttons ────────────────────────────────────────────────────────────

// Delegación global: se registra UNA sola vez en document
let _radioListenerRegistered = false;

function setupClickRadioButton() {
  if (_radioListenerRegistered) {
    // Ya registrado; solo verificar si hay uno pre-seleccionado al volver
    _triggerCheckedRadio();
    return;
  }

  document.addEventListener('change', _handleRadioDelegate);
  _radioListenerRegistered = true;

  _triggerCheckedRadio();
}

function _handleRadioDelegate(e) {
  if (
    e.target.tagName === 'INPUT' &&
    e.target.type === 'radio' &&
    e.target.name === 'list-radio'
  ) {
    handleRadioChange(e);
  }
}

function handleRadioChange(e) {
  setupCards(e.target.value);
}

// Si al cargar la página ya hay un radio marcado, renderizar las cartas
function _triggerCheckedRadio() {
  const checked = document.querySelector('input[name="list-radio"]:checked');
  if (checked) {
    setupCards(checked.value);
  } else {
    showEmptyState();
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function showEmptyState() {
  const gameDiv = document.getElementById('game');
  if (!gameDiv) return;
  gameDiv.innerHTML = `
    <div class="game-empty">
      <div class="game-empty-icon">🃏</div>
      <p class="game-empty-text">Elige una categoría arriba<br>para comenzar tu exploración</p>
    </div>
  `;
}

// ─── Socket listeners (placeholder) ──────────────────────────────────────────
function setupSocketListeners() {
  if (!socket) return;
  // socket.on('cardUpdate', handleCardUpdate);
}

// ─── Initialize ───────────────────────────────────────────────────────────────
function initializeCartas() {
  injectStyles();

  const gameDiv = document.getElementById('game');
  if (!gameDiv) {
    console.error('Error: No se encontró el contenedor del juego (#game).');
    showError('Error: No se encontró el contenedor del juego.');
    return;
  }

  showEmptyState();
  setupClickRadioButton();
  setupSocketListeners();
}

/* ─── INIT ─────────────────────────────────────────────────────────────────── */
/* ─── INIT ─────────────────────────────────────────────────────────────────── */

function initCartas() {

  const gameDiv = document.getElementById("game");

  // Si no estamos en la página del juego salimos
  if (!gameDiv) return;

  console.log("Inicializando juego de cartas...");

  injectStyles();
  showEmptyState();
  setupClickRadioButton();
  setupSocketListeners();
}

/* Primera carga normal */
document.addEventListener("DOMContentLoaded", initCartas);

/* Cuando Astro cambia de página (muy importante) */
document.addEventListener("astro:after-swap", initCartas);