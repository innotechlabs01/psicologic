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
  "¿Qué te hace sentir mas conectado/a conmigo?",
  "¿Qué es lo que más te gusta hacer cuando estamos juntos?",
  "¿Qué es lo que te atrajo de mí cuando nos conocimos?",
  "¿Que es lo que más te gusta de nuestra vida sexual?",
  "¿Hay algo en lo que te gustaria que trabajaramos como pareja?",
  "Conectamos",
  "¿Que es lo más te sorprende de mi?",
  "¿Que es lo más importante que has aprendido de nuestra relación?",
  "¿Para ti cúal ha sido el momento más dificil en nuestra relación?",
  "¿Cuál es tu mayor temor en nuestra relación?",
  "¿Qué te gustaría intentar o experimentar conmigo?",
];
const QuestionFire = [
  "¿Te gusta alguien del mismo sexo o te ha llamado la atención?",
  "¿Qué te exita más?",
  "Intimo",
  "¿Te gusta hablar sucio durante el sexo?",
  "¿Qué opinas del sexo tántrico?",
  "¿Cuál es tu recuerdo sexual favorito de nosotros?",
  "¿Te gusta experimentar con juguetes sexuales?",
  "¿Qué es lo que más te gusta que te hagan para calentarte?",
  "¿Qué parte de mi cuerpo te atrae más?",
  "¿Hay algo que siempre hayas querido probrar en la cama pero no lo has mencionado?",
  "¿Qué es lo más  disfrutas despues del sexo?",
  "¿Prefieres ser dominante o sumiso/a en la cama?",
  "¿Hay algo que te gustaría mejorar o cambiar en nuestra vida sexual?",
  "¿Cuál es tu posición favorita?",
  "¿Qué prefieres, sexo rapido y apasionado o lento y romantico?",
  "¿Qué opinas del sexo en lugares publicos?",
  "¿Comó te gusta que te toquen?",
  "¿Tienes alguna fantasia relacionada con los roles o disfrases?",
  "¿Te gusta probar nuevas técnicas o prefieres mantenerte con lo conocido?",
  "¿Cuál es tu fantasia sexual más secreta?"
];
const QuestionTruth = [
  {
    title: "Declaración",
    question: "Hazle una declaración de amor improvisada a tu pareja.",
  },
  {
    title: "Pregunta Intima",
    question: "Responder  sinceramente a una pregunta intima de tu pareja.",
  },
  {
    title: "Plan de fin de semana",
    question: "Organiza un plan para el fin de semana. Tiene que ser algo que hemos hecho antes.",
  },
  {
    title: "Lista de deseos",
    question: "Crear juntos una lista de deseos sexuales para realizar a futuro.",
  },
  {
    title: "Comodin",
    question: "Esta carta te ayuda  a descartar una tarea del hogar que no te guste y no hacerla en toda la semana.",
  },
  {
    title: "Striptease",
    question: "Haz un striptease a tu pareja.",
  },
  {
    title: "Ejercicio Juntos",
    question: "Hacer una rutina de ejercicios juntos en ropa interior.",
  },
  {
    title: "No Hablar",
    question: "Comunicarse solo con el cuerpo durante 10 min.",
  },
  {
    title: "Deseo Secreto",
    question: "Cumplir un deseo secreto que tu pareja escriba en un papel.",
  },
  {
    title: "Fotos Sensuales",
    question: "Tomarse fotos sensuales mutuamente.",
  },
  {
    title: "Juego de Roles",
    question: "Intercambia roles durante 10 min y actua como tu pareja.",
  },
  {
    title: "Aumenta el pulso",
    question: "Dar besos por todo el cuerpo a tu pareja durante 5 min.",
  },
  {
    title: "Frases de Amor",
    question: "Describe en una frase lo que sientes por tu pareja y leela en voz alta.",
  },
  {
    title: "Retos",
    question: "",
  },
  {
    title: "Los Ojos",
    question: "Mirarse fijamente a los ojos durante 3 min sin hablar.",
  },
  {
    title: "Juego de Disfraces",
    question: "Disfrazarse y actuar una fantasia juntos.",
  },
  {
    title: "Masaje Erótico",
    question: "Dedicale un masaje de 20 min. a tu pareja usando aceites intimo.",
  },
  {
    title: "Baila Sensual",
    question: "Baila sensual para tu pareja.",
  },
  {
    title: "Premio",
    question: "Te haz ganado un desayuno en la cama.",
  },
  {
    title: "Llamada Sexy",
    question: "Hacer una llamada o enviar mensajes picantes con tu pareja estando en la misma casa.",
  }
];

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

  cardValues.forEach((cardData) => {
    const { question, number } = cardData;

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="card ${gameType}">
        <div class="back">
          <img src="/img/${gameType}.svg" alt="${gameType}" class="w-12 h-12 mb-2">
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

    // Color según el tipo de juego
    if (gameType === 'fuego') {
      card.querySelector('.face').style.color = 'red';
    } else if (gameType === 'rayo') {
      card.querySelector('.face').style.color = 'gold';
    } else {
      card.querySelector('.face').style.color = 'pink';
    }

    card.addEventListener('click', (e) => activate(e));
    cards.push(div);
    gameDiv.appendChild(div);
  });

}

function generateCardValues(gameType) {
  const values = [];
  let availableQuestions = [];

  // Obtener todas las preguntas según el tipo
  if (gameType === 'besos') {
    availableQuestions = QuestionKiss.map(q => ({ title: null, question: q }));
  } else if (gameType === 'fuego') {
    availableQuestions = QuestionFire.map(q => ({ title: null, question: q }));
  } else if (gameType === 'rayo') {
    availableQuestions = [...QuestionTruth]; // ya vienen con {title, question}
  }

  // 🔀 Barajar preguntas con Fisher–Yates
  for (let i = availableQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
  }

  // ✅ Seleccionar 20 preguntas únicas
  const selected = availableQuestions.slice(0, totalCards);

  // Generar 20 cartas únicas
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