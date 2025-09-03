const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const totalCards = 12;
const QUESTIONS = [
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
const selecciones = [];
let cards = [];
let valuesUsed = [];
let currentMove = 0;
let currentAttempts = 0;

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    if (typeof io === 'undefined') {
        showError('No se pudo conectar con el servidor (Socket.io no disponible).');
        updateTitle('Error');
        return;
    }

    if (!token) {
        showError('No se proporcionó un token en la URL.');
        updateTitle('Acceso Denegado');
        return;
    }

    console.log('Initializing game with token:', token);
    validateToken();
    setupCards();
    setupEventListeners();
}

async function validateToken() {
    const enviarBtn = document.getElementById('enviarBtn');
    if (enviarBtn) enviarBtn.disabled = true;

    try {
        console.log('Validating token:', token);
        const response = await fetch(`/api/games/validar-token?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Fetch response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error validando token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (data.valido) {
            document.getElementById('playerName').textContent = data.nombre || 'Jugador';
            socket.emit('validar-token', token, (response) => {
                if (response.valido) {
                    console.log(`Socket token validated for ${response.nombre}`);
                    if (enviarBtn) enviarBtn.disabled = false;
                } else {
                    showError('Token inválido en Socket.IO.');
                    updateTitle('Acceso Denegado');
                }
            });
        } else {
            showError('Token no válido.');
            updateTitle('Acceso Denegado');
        }
    } catch (err) {
        console.error('Error en validar-token:', err.message);
        showError(`Error al validar el token: ${err.message}`);
        updateTitle('Error');
        if (enviarBtn) enviarBtn.disabled = true;
    }
}

function setupCards() {
    const gameDiv = document.getElementById('game');
    if (!gameDiv) {
        showError('Error: No se encontró el contenedor del juego.');
        return;
    }

    gameDiv.innerHTML = '';
    cards = [];
    valuesUsed = [];

    const cardValues = generateCardValues();
    cardValues.forEach((question, index) => {
        const div = document.createElement('div');
        div.innerHTML = '<div class="card"><div class="back"></div><div class="face"></div></div>';
        div.querySelector('.card').dataset.cartaId = question;
        div.querySelector('.face').innerText = question;
        div.querySelector('.card').addEventListener('click', (e) => activate(e));
        cards.push(div);
        gameDiv.appendChild(div);
    });
}

function generateCardValues() {
    const values = [];
    const maxPairs = totalCards / 2;
    const availableQuestions = QUESTIONS.slice(0, maxPairs);

    for (let i = 0; i < maxPairs; i++) {
        values.push(availableQuestions[i]);
        values.push(availableQuestions[i]);
    }

    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }

    return values;
}

function activate(e) {
    const card = e.currentTarget;
    
    // Toggle the flip state
    const isFlipped = card.classList.toggle('flip');
    const cartaName = card.dataset.cartaId;
    
    console.log('Carta seleccionada:', cartaName, 'Estado:', isFlipped);
    
    // Emitir evento inmediatamente al socket
    socket.emit('cartaSeleccionada', {
        token,
        cartaId: cartaName,
        pregunta: card.querySelector('.face').innerText,
        flipped: isFlipped,
        selected: isFlipped,
        timestamp: Date.now()
    });

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

function setupEventListeners() {
    // Solo manejar eventos de conexión
    socket.on('connect_error', (err) => {
        showError(`Error de conexión con el servidor: ${err.message}`);
        updateTitle('Error');
    });

    window.addEventListener('unload', () => {
        socket.off('connect_error');
        socket.disconnect();
    });
}

function updateEnviarButton() {
    const enviarBtn = document.getElementById('enviarBtn');
    if (enviarBtn) {
        enviarBtn.disabled = selecciones.length === 0;
    }
}

function showError(message) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
        mensajeDiv.textContent = message;
        mensajeDiv.classList.remove('hidden');
        mensajeDiv.style.display = 'block';
    } else {
        console.error(message);
    }
}

function updateTitle(title) {
    const titulo = document.getElementById('titulo');
    if (titulo) {
        titulo.textContent = title;
    }
}