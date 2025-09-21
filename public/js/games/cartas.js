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

function createCardElement(cartaId, gameType, pregunta, cardNumber) {
    const card = document.createElement('div');
    card.classList.add('card', 'w-24', 'h-36', 'rounded-lg', 'shadow-lg', 'cursor-pointer', 'transition-all', 'duration-300', 'ease-in-out', 'transform', 'hover:scale-105', 'flex', 'items-center', 'justify-center', 'bg-cover', 'bg-center', 'mb-4', 'other-selected');
    card.dataset.cartaId = cartaId;
    card.innerHTML = `
    <div class="back">${cardNumber}</div>
    <div class="face flex flex-col items-center justify-center bg-white p-4">
        <span class="text-sm text-gray-800 text-center">${pregunta || QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]}</span>
    </div>
    `;
    return card;
}

function setupSocketListeners() {
    const playerStates = new Map();
    function handleCardUpdate(user, cartaId, pregunta, flipped, gameType, timestamp) {
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
}

function setupCards(gameType) {
    const gameDiv = document.getElementById('game');
    if (!gameDiv) {
    showError('Error: No se encontró el contenedor del juego.');
    return;
    }
    gameDiv.innerHTML = '';
    cards = [];
    valuesUsed = [];
    const cardValues = generateCardValues(gameType);
    cardValues.forEach((cardData, index) => {
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
}

function generateCardValues(gameType) {
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
    return values;
}

function activate(e) {
    const card = e.currentTarget;
    const isFlipped = card.classList.toggle('flip');
    const cartaName = card.dataset.cartaId;
    if (currentMove === 2) {
    currentAttempts++;
    document.getElementById('stats').textContent = `${currentAttempts} intentos`;
    const activeCards = document.querySelectorAll('.card.flip:not(.matched)');
    if (activeCards.length === 2) {
        const [card1, card2] = activeCards;
        if (card1.dataset.cartaId === card2.dataset.cartaId) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        socket.emit('cardFlipped', {
            token,
            cartaId: card1.dataset.cartaId,
            flipped: true,
            matched: true,
            selected: selecciones.includes(card1.dataset.cartaId)
        });
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
            socket.emit('cardFlipped', {
            token,
            cartaId: card1.dataset.cartaId,
            flipped: false,
            matched: false,
            selected: false
            });
            socket.emit('cardFlipped', {
            token,
            cartaId: card2.dataset.cartaId,
            flipped: false,
            matched: false,
            selected: false
            });
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
    }
}

function setupClickRadioButton() {
    const radioButtons = document.querySelectorAll('input[name="list-radio"]');
    radioButtons.forEach(radio => {
    radio.addEventListener('change', async (e) => {
        const gameType = e.target.value;
        const gameTypeContainer = document.getElementById('game-type-container');
        switch(gameType) {
        case 'besos':
            setupCards(gameType);
            break;
        case 'fuego':
            setupCards(gameType);
            break;
        case 'rayo':
            setupCards(gameType);
            break;
        default:
            gameTypeContainer?.classList.add('hidden');
            break;
        }
    });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DOM Content Loaded - Inicializando juego de cartas...');
    // initCartasGame();
    setupClickRadioButton();
    setupSocketListeners();
});