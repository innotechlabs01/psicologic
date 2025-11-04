const QuestionSets = {
  "identificar_miedo": [
    "¿Qué miedo es el que más me impide avanzar hoy?",
    "¿Qué dice este miedo de mi?",
    "¿Cuando fue la primera vez que senti este miedo?",
    "¿Qué evito por este miedo?",
    "¿Cómo reacciona mi cuerpo cuando tengo miedo?",
    "¿Cuándo aparece con mayor fuerza este meido?",
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

const state = {
  users: [],
  currentUserId: null,
  paymentScriptLoaded: false
};
const totalCards = 20;
const selecciones = [];
let cards = [];
let valuesUsed = [];
let currentMove = 0;
let currentAttempts = 0;

// Placeholder para el socket
let socket = null; // Debes inicializarlo, por ejemplo: import { io } from 'socket.io-client'; socket = io('http://localhost:4321');

function createCardElement(cartaId, gameType, pregunta, cardNumber) {
  const card = document.createElement('div');
  card.classList.add('card', 'w-24', 'h-36', 'rounded-lg', 'shadow-lg', 'cursor-pointer', 'transition-all', 'duration-300', 'ease-in-out', 'transform', 'hover:scale-105', 'flex', 'items-center', 'justify-center', 'bg-cover', 'bg-center', 'mb-4', 'other-selected');
  card.dataset.cartaId = cartaId;
  card.innerHTML = `
    <div class="back">
      <img src="heart.svg" alt="${gameType}" class="w-12 h-12 mb-2">
      ${cardNumber}
    </div>
    <div class="face flex flex-col items-center justify-center bg-white p-4">
      <span class="text-sm text-gray-800 text-center">${pregunta}</span>
    </div>
  `;
  card.addEventListener('click', (e) => activate(e));
  return card;
}

function setupSocketListeners() {
  if (!socket) {
    return;
  }
  const playerStates = new Map();
  function handleCardUpdate(user, cartaId, pregunta, flipped, gameType, timestamp) {
    let playerSection = document.getElementById(`player-${user}`);
    if (!playerSection) {
      playerSection = initializePlayerSection(user, gameType || 'besos');
    }
    const playerCards = document.getElementById(`cards-${user}`);
    if (!playerCards) {
      console.error('No se encontró la sección de cartas del jugador');
      return;
    }
    let userState = playerStates.get(user);
    if (!userState) {
      userState = {
        selectedCards: new Set(),
        firstCard: null,
        lastUpdate: 0
      };
      playerStates.set(user, userState);
    }
    if (timestamp && timestamp <= userState.lastUpdate) return;
    userState.lastUpdate = timestamp || Date.now();
    let card = playerCards.querySelector(`.card[data-carta-id="${cartaId}"]`);
    if (!card) {
      const currentGameType = playerCards.dataset.gameType || gameType || 'besos';
      const cardNumber = Math.floor(Math.random() * totalCards) + 1;
      card = createCardElement(cartaId, currentGameType, pregunta, cardNumber);
    }
    if (flipped) {
      if (userState.firstCard && userState.firstCard !== cartaId) {
        const oldFirstCard = playerCards.querySelector(`.card[data-carta-id="${userState.firstCard}"]`);
        if (oldFirstCard) {
          oldFirstCard.classList.remove('first-selected');
          oldFirstCard.classList.add('other-selected');
          playerCards.querySelector('.other-cards-container').appendChild(oldFirstCard);
        }
      }
      userState.firstCard = cartaId;
      card.classList.add('first-selected');
      card.classList.remove('other-selected');
      playerCards.querySelector('.first-card-container').appendChild(card);
    } else {
      playerCards.querySelector('.other-cards-container').appendChild(card);
    }
    card.style.transition = 'all 0.3s ease-in-out';
    if (flipped) {
      card.classList.add('active', 'flip');
      userState.selectedCards.add(cartaId);
      if (cartaId === userState.firstCard) {
        card.classList.add('first-selected');
        card.classList.remove('other-selected');
        const firstContainer = playerCards.querySelector('.first-card-container');
        if (card.parentElement !== firstContainer) {
          firstContainer.appendChild(card);
        }
      } else {
        card.classList.add('other-selected');
        card.classList.remove('first-selected');
        const otherContainer = playerCards.querySelector('.other-cards-container');
        if (card.parentElement !== otherContainer) {
          otherContainer.appendChild(card);
        }
      }
      card.style.transform = 'scale(1.05) rotateY(180deg)';
    } else {
      card.classList.remove('active', 'flip', 'first-selected', 'other-selected');
      userState.selectedCards.delete(cartaId);
      if (cartaId === userState.firstCard) {
        userState.firstCard = null;
      }
      card.style.transform = '';
      const otherContainer = playerCards.querySelector('.other-cards-container');
      otherContainer.appendChild(card);
    }
    updatePlayerStats(playerSection, userState);
  }
  // Configura los listeners del socket
  socket.on('cardUpdate', handleCardUpdate);
}

function initializePlayerSection(user, gameType) {
  const playerSection = document.createElement('div');
  playerSection.id = `player-${user}`;
  playerSection.innerHTML = `
    <div id="cards-${user}" data-game-type="${gameType}" class="cards-container">
      <div class="first-card-container"></div>
      <div class="other-cards-container"></div>
    </div>
  `;
  const gameDiv = document.getElementById('game');
  if (gameDiv) {
    gameDiv.appendChild(playerSection);
  } else {
    console.error('Error: No se encontró #game para añadir sección de jugador');
  }
  return playerSection;
}

function updatePlayerStats(playerSection, userState) {
  console.log('📊 Actualizando estadísticas para:', playerSection.id, userState);
}

function setupCards(gameType = 'besos') {
  const gameDiv = document.getElementById('game');
  if (!gameDiv) {
    showError('Error: No se encontró el contenedor del juego.');
    return;
  }
  gameDiv.innerHTML = '';
  cards = [];
  valuesUsed = [];

  const cardValues = generateCardValues(gameType);

  // 🎨 NUEVO MAPEO DE COLORES
  const colorMap = {
    'identificar_miedo': '#497554',      // Verde Oscuro
    'cuestionando_miedo': '#95C7A2',     // Verde Claro
    'reencuadre': '#C34FC9',             // Púrpura
    'accion_confrontacion': '#E87F23',   // Naranja
    'liberacion_reconexion': '#F0F018',  // Amarillo Brillante
    // Puedes añadir otros tipos de juego como 'besos' si es necesario
    'besos': '#FFFFFF',
    'fuego': '#FFFFFF',
    'rayo': '#FFFFFF'
  };

  // Obtener el color basado en el tipo de juego, con un color blanco por defecto
  const cardColor = colorMap[gameType] || '#FFFFFF'; 

  cardValues.forEach((cardData) => {
    const { question, number } = cardData;

    const div = document.createElement('div');
    // Se ha eliminado la clase 'card' de aquí, se añade directamente al elemento interno
    div.innerHTML = `
      <div class="card ${gameType}">
        <div class="back">
          <img src="/img/${gameType}.png" alt="${gameType}" class="w-12 h-12 mb-2">
          ${number}
        </div>
        <div class="face flex flex-col items-center justify-center p-2 text-center">
          ${question.title ? `<h3 class="text-md font-bold mb-2 text-yellow-600">${question.title}</h3>` : ""}
          <p class="text-sm">${question.question}</p>
        </div>
      </div>
    `;

    const card = div.querySelector('.card');
    card.dataset.cartaId = question.question;

    // 🎨 LÓGICA DE COLOR SIMPLIFICADA
    // Asigna el color a la cara de la tarjeta usando el mapa de colores
    const faceElement = card.querySelector('.face');
    if (faceElement) {
        faceElement.style.color = cardColor;
    }


    card.addEventListener('click', (e) => activate(e));
    cards.push(div);
    gameDiv.appendChild(div);
  });
}

function generateCardValues(gameType) {
  const values = [];
  let availableQuestions = [];

  // Paso 1: Obtener las preguntas del set unificado.
  // Usamos el `gameType` (que viene de los radio buttons) como clave.
  // La estructura de tus datos previos no coincidía con las claves de
  // tus radio buttons. Asumiré que quieres usar las claves de tu código
  // (identificar_miedo, cuestionando_miedo, etc.).
  
  const questionArray = QuestionSets[gameType];

  if (!questionArray || questionArray.length === 0) {
    console.warn(`⚠️ Tipo de juego no reconocido o sin preguntas: ${gameType}`);
    // Fallback si el tipo de juego no existe o si no hay preguntas
    return []; 
  }

  // Las preguntas de estos sets son strings simples, no objetos {title, question}.
  availableQuestions = questionArray.map(q => ({ title: null, question: q }));

  // 🔀 Paso 2: Barajar preguntas con Fisher–Yates
  for (let i = availableQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
  }

  // ✅ Paso 3: Seleccionar el número de cartas
  // Aseguramos que no se exceda el número total de cartas disponibles.
  const cardsToSelect = Math.min(totalCards, availableQuestions.length);
  const selected = availableQuestions.slice(0, cardsToSelect);

  // Generar las cartas
  selected.forEach((question, i) => {
    values.push({ question, number: i + 1 });
  });

  return values;
}

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
  if (currentMove === 2) {
    currentAttempts++;
    document.getElementById('stats').textContent = `${currentAttempts} intentos`;
    const activeCards = document.querySelectorAll('.card.flip:not(.matched)');
    if (activeCards.length === 2) {
      const [card1, card2] = activeCards;
      if (card1.dataset.cartaId === card2.dataset.cartaId) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        // socket.emit('cardFlipped', { ... });
        currentMove = 0;
      } else {
        setTimeout(() => {
          card1.classList.remove('flip');
          card2.classList.remove('flip');
          const index1 = selecciones.indexOf(card1.dataset.cartaId);
          const index2 = selecciones.indexOf(card2.dataset.cartaId);
          if (index1 !== -1) selecciones.splice(index1, 1);
          if (index2 !== -1) selecciones.splice(index2, 1);
          // socket.emit('cardFlipped', { ... });
          currentMove = 0;
          updateEnviarButton();
        }, 600);
      }
    }
  }
  updateEnviarButton();
}

function updateEnviarButton() {
  const enviarBtn = document.getElementById('enviarBtn');
  if (enviarBtn) {
    enviarBtn.disabled = selecciones.length === 0;
  } else {
    console.warn('⚠️ No se encontró #enviarBtn');
  }
}

function setupClickRadioButton() {
  const radioButtons = document.querySelectorAll('input[name="list-radio"]');
  if (radioButtons.length === 0) {
    console.warn('⚠️ No se encontraron radio buttons con name="list-radio"');
  } else {
  }
  radioButtons.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const gameType = e.target.value;
      setupCards(gameType);
    });
  });
}

function showError(message) {
  console.error(message);
  const errorDiv = document.getElementById('error');
  if (errorDiv) {
    errorDiv.textContent = message;
  }
}

export function initializeCartas() {
  // Limpiar el contenedor #game para asegurar que esté vacío
  const gameDiv = document.getElementById('game');
  if (gameDiv) {
    gameDiv.innerHTML = '';
  } else {
    console.error('Error: No se encontró el contenedor del juego (#game).');
    showError('Error: No se encontró el contenedor del juego.');
  }
  // Asegurar que el DOM esté listo antes de inicializar
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupClickRadioButton();
    setupSocketListeners();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setupClickRadioButton();
      setupSocketListeners();
    });
  }
}

// Inicializar automáticamente si el script se carga como módulo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeCartas();
} else {
  document.addEventListener('DOMContentLoaded', initializeCartas);
}