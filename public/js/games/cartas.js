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
  "¿Qué hace que sientas más conmigo?",
  "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
  "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
];
const QuestionFire = [
  "¿Cómo te imaginas nuestro futuro juntos?",
  "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
  "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
  "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
  "¿Hay algo que te gustaría que hiciéramos más a menudo?",
  "¿Hay algo que sientas que no hemos discutido lo suficiente?",
  "¿Cómo puedo animarte cuando te sientas triste?",
  "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
  "¿Cómo describirías nuestra relación en tres palabras?",
  "¿Qué hace que sientas más conmigo?",
  "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
  "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
];
const QuestionTruth = [
  "¿Cómo te imaginas nuestro futuro juntos?",
  "¿Hay alguna tradición o hábito que te gustaría que empecemos como pareja?",
  "¿Cómo podemos hacer que nuestra relación sea aún más fuerte?",
  "¿Cómo te gustaría que celebremos nuestro próximo aniversario?",
  "¿Hay algo que te gustaría que hiciéramos más a menudo?",
  "¿Hay algo que sientas que no hemos discutido lo suficiente?",
  "¿Cómo puedo animarte cuando te sientas triste?",
  "¿Hay algo que siempre has querido saber sobre mí pero nunca preguntado?",
  "¿Cómo describirías nuestra relación en tres palabras?",
  "¿Qué hace que sientas más conmigo?",
  "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
  "¿Qué es lo que te atrajo de mí cuando nos conocimos?"
];

const state = {
  users: [],
  currentUserId: null,
  paymentScriptLoaded: false
};
const totalCards = 12;
const selecciones = [];
let cards = [];
let valuesUsed = [];
let currentMove = 0;
let currentAttempts = 0;

// Placeholder para el socket
let socket = null; // Debes inicializarlo, por ejemplo: import { io } from 'socket.io-client'; socket = io('http://localhost:4321');

function createCardElement(cartaId, gameType, pregunta, cardNumber) {
  console.log(`🃏 Creando carta: ${cartaId}, tipo: ${gameType}, número: ${cardNumber}`);
  const card = document.createElement('div');
  card.classList.add('card', 'w-24', 'h-36', 'rounded-lg', 'shadow-lg', 'cursor-pointer', 'transition-all', 'duration-300', 'ease-in-out', 'transform', 'hover:scale-105', 'flex', 'items-center', 'justify-center', 'bg-cover', 'bg-center', 'mb-4', 'other-selected');
  card.dataset.cartaId = cartaId;
  card.innerHTML = `
    <div class="back">${cardNumber}</div>
    <div class="face flex flex-col items-center justify-center bg-white p-4">
      <span class="text-sm text-gray-800 text-center">${pregunta}</span>
    </div>
  `;
  card.addEventListener('click', (e) => activate(e));
  return card;
}

function setupSocketListeners() {
  if (!socket) {
    console.warn('⚠️ Socket no inicializado. Asegúrate de configurar el WebSocket.');
    return;
  }
  const playerStates = new Map();
  function handleCardUpdate(user, cartaId, pregunta, flipped, gameType, timestamp) {
    console.log(`📡 Actualización de carta: user=${user}, cartaId=${cartaId}, flipped=${flipped}`);
    let playerSection = document.getElementById(`player-${user}`);
    if (!playerSection) {
      console.log(`Creando nueva sección para jugador ${user}`);
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
      console.log('Creando nueva carta:', cartaId);
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
  console.log(`🔧 Inicializando sección para jugador ${user}`);
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
  console.log(`🎮 Configurando cartas para tipo: ${gameType}`);
  const gameDiv = document.getElementById('game');
  if (!gameDiv) {
    console.error('Error: No se encontró el contenedor del juego (#game).');
    showError('Error: No se encontró el contenedor del juego.');
    return;
  }
  gameDiv.innerHTML = '';
  cards = [];
  valuesUsed = [];
  const cardValues = generateCardValues(gameType);
  cardValues.forEach((cardData, index) => {
    console.log(`🃏 Generando carta ${index + 1}: ${cardData.question}`);
    const div = document.createElement('div');
    div.innerHTML = `<div class="card ${gameType}"><div class="back">${cardData.number}</div><div class="face"></div></div>`;
    const card = div.querySelector('.card');
    card.dataset.cartaId = cardData.question;
    const face = div.querySelector('.face');
    face.innerText = cardData.question;
    if (gameType === 'fuego') {
      face.style.color = 'red';
      face.style.borderColor = 'red';
    } else if (gameType === 'rayo') {
      face.style.color = 'gold';
      face.style.borderColor = 'gold';
    } else {
      face.style.color = 'pink';
      face.style.borderColor = 'pink';
    }
    card.addEventListener('click', (e) => activate(e));
    cards.push(div);
    gameDiv.appendChild(div);
  });
  console.log(`✅ ${cards.length} cartas generadas`);
}

function generateCardValues(gameType) {
  console.log(`🔢 Generando valores para tipo: ${gameType}`);
  const values = [];
  const maxPairs = totalCards / 2;
  let availableQuestions = [];
  if (gameType === 'besos') {
    availableQuestions = QuestionKiss.slice(0, maxPairs);
  } else if (gameType === 'fuego') {
    availableQuestions = QuestionFire.slice(0, maxPairs);
  } else if (gameType === 'rayo') {
    availableQuestions = QuestionTruth.slice(0, maxPairs);
  }
  for (let i = 0; i < maxPairs; i++) {
    values.push({ question: availableQuestions[i], number: (i * 2) + 1 });
    values.push({ question: availableQuestions[i], number: (i * 2) + 2 });
  }
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  console.log(`🔢 ${values.length} valores generados`);
  return values;
}

function activate(e) {
  console.log('🃏 Carta clicada:', e.currentTarget.dataset.cartaId);
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
          console.log('Selecciones actuales:', selecciones);
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
    console.log(`🔘 Botón enviar: ${enviarBtn.disabled ? 'deshabilitado' : 'habilitado'}`);
  } else {
    console.warn('⚠️ No se encontró #enviarBtn');
  }
}

function setupClickRadioButton() {
  const radioButtons = document.querySelectorAll('input[name="list-radio"]');
  if (radioButtons.length === 0) {
    console.warn('⚠️ No se encontraron radio buttons con name="list-radio"');
  } else {
    console.log(`🔧 Encontrados ${radioButtons.length} radio buttons`);
  }
  radioButtons.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const gameType = e.target.value;
      console.log(`🎮 Cambiando tipo de juego a: ${gameType}`);
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
  console.log('🔍 Inicializando juego de cartas...');
  // Limpiar el contenedor #game para asegurar que esté vacío
  const gameDiv = document.getElementById('game');
  if (gameDiv) {
    gameDiv.innerHTML = '';
    console.log('🧹 Contenedor #game limpiado');
  } else {
    console.error('Error: No se encontró el contenedor del juego (#game).');
    showError('Error: No se encontró el contenedor del juego.');
  }
  // Asegurar que el DOM esté listo antes de inicializar
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🔄 DOM listo, ejecutando inicialización');
    setupClickRadioButton();
    setupSocketListeners();
  } else {
    console.log('⏳ Esperando DOMContentLoaded para inicializar');
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