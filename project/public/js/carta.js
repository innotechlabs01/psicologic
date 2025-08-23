document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const cartas = ['As de Corazones', 'Rey de Picas', 'Dama de Tréboles', 'Jota de Diamantes', '10 de Corazones'];
  const selecciones = [];

  // Initialize the game
  function initializeGame() {
    if (typeof io === 'undefined') {
      showError('No se pudo conectar con el servidor (Socket.io no disponible).');
      document.getElementById('titulo').textContent = 'Error';
      return;
    }

    if (!token) {
      showError('No se proporcionó un token.');
      document.getElementById('titulo').textContent = 'Acceso Denegado';
      return;
    }

    validateToken();
    setupCards();
    setupEventListeners();
  }

  // Validate token with the server
  async function validateToken() {
    try {
      const response = await fetch(`/api/games/validar-token?token=${token}`);
      const data = await response.json();
      if (data.valido) {
        document.getElementById('titulo').textContent = `Bienvenido, ${data.nombre}`;
        document.getElementById('juego').classList.add('active');
        socket.emit('validar-token', token, (res) => {
          if (!res.valido) {
            showError('Token inválido. No puedes jugar.');
            document.getElementById('juego').classList.remove('active');
          }
        });
      } else {
        showError('Token inválido o no proporcionado.');
        document.getElementById('titulo').textContent = 'Acceso Denegado';
      }
    } catch (err) {
      showError(`Error al validar el token: ${err.message}`);
    }
  }

  // Setup card elements
  function setupCards() {
    const mazoDiv = document.getElementById('mazo');
    if (!mazoDiv) {
      showError('Error: No se encontró el contenedor del mazo.');
      return;
    }

    cartas.forEach((carta) => {
      const div = document.createElement('div');
      div.className = 'carta';
      div.textContent = carta;
      div.addEventListener('click', () => {
        if (selecciones.includes(carta)) {
          selecciones.splice(selecciones.indexOf(carta), 1);
          div.classList.remove('seleccionada');
        } else {
          selecciones.push(carta);
          div.classList.add('seleccionada');
        }
      });
      mazoDiv.appendChild(div);
    });
  }

  // Setup event listeners
  function setupEventListeners() {
    const enviarBtn = document.getElementById('enviarBtn');
    if (enviarBtn) {
      enviarBtn.addEventListener('click', () => {
        if (selecciones.length > 0) {
          socket.emit('seleccionCartas', { token, cartas: selecciones });
          alert('Selecciones enviadas al administrador');
        } else {
          alert('Selecciona al menos una carta');
        }
      });
    } else {
      showError('Error: No se encontró el botón de enviar.');
    }

    socket.on('connect_error', (err) => {
      showError(`Error de conexión con el servidor: ${err.message}`);
    });
  }

  // Display error messages
  function showError(message) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
      mensajeDiv.textContent = message;
    } else {
      console.error(message);
    }
  }

  // Start the game
  initializeGame();
});