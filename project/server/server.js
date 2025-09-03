import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sequelize from './db.js';
import User from './models/user.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment/index.js';
import gameRoutes from './routes/games/index.js';
import { authenticateJWT } from './middlewares/auth.js';
// Importar la función de inicialización
import { initializeDatabase } from './db.js';

// Load environment variables
dotenv.config();

// Helpers for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express and HTTP server
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store valid tokens for card game
const tokensValidos = new Map();

// Middleware de depuración para rastrear solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Global middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Demasiadas solicitudes, intenta de nuevo más tarde.'
}));
app.use(express.json());
app.use(morgan('dev'));

// Mercado Pago configuration
// Mercado Pago configuration
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});
app.locals.mercadopago = { client, Payment, Preference };

// Serve static files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath, {
  extensions: ['html', 'css', 'js'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/games', gameRoutes(tokensValidos));

// Endpoint de prueba simple sin autenticación
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong' });
});

app.get('/user-page/:id', (req, res) => {
  res.sendFile('user-page.html', { root: path.join(__dirname, '../public') });
});

// Ruta raíz modificada para manejar !req.user
app.get(['/', '/index.html', '/register.html'], authenticateJWT, async (req, res) => {
  try {
    if (!req.user) {
      return res.sendFile('index.html', { root: publicPath });
    }
    const user = await User.findOne({ where: { email: req.user.email } });
    if (req.user.role === 'admin') {
      return res.redirect('/dashboard.html');
    }
    if (user?.link) {
      return res.redirect(user.link);
    }
    res.sendFile('index.html', { root: publicPath });
  } catch (err) {
    console.error('Error verificando usuario:', err);
    res.status(500).send('Error interno del servidor');
  }
});

// Estructura para mantener el estado del juego
const gameStates = new Map();

// Socket.io connections
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  let currentUser = null;

  socket.on('validar-token', (token, callback) => {
    console.log('Validando token en Socket.io:', token);
    if (tokensValidos.has(token)) {
      const userData = tokensValidos.get(token);
      userData.socketId = socket.id;
      currentUser = { token, ...userData };
      
      // Inicializar estado del juego si no existe
      if (!gameStates.has(userData.gameId)) {
        gameStates.set(userData.gameId, {
          players: {},
          currentTurn: userData.nombre,
          matchedPairs: [],
          selectedCards: new Map()
        });
      }
      
      callback({ 
        valido: true, 
        nombre: userData.nombre,
        gameState: gameStates.get(userData.gameId)
      });
      
      // Notificar a todos los jugadores del juego
      socket.join(userData.gameId);
      io.to(userData.gameId).emit('gameState', gameStates.get(userData.gameId));
    } else {
      callback({ valido: false });
    }
  });

  socket.on('cartaSeleccionada', ({ token, cartaId, pregunta, flipped, selected, timestamp }) => {
    if (tokensValidos.has(token)) {
      const userData = tokensValidos.get(token);
      const { nombre, gameId } = userData;
      
      console.log(`Carta ${cartaId} ${flipped ? 'seleccionada' : 'deseleccionada'} por ${nombre}`);
      
      // Emitir el evento a todos los clientes, especialmente al admin
      io.emit('actualizacionCarta', {
        user: nombre,
        cartaId,
        pregunta,
        flipped,
        selected,
        gameId,
        timestamp
      });

      // Guardar el estado actual de la carta para este usuario
      if (!gameStates.has(gameId)) {
        gameStates.set(gameId, { players: {} });
      }
      
      const gameState = gameStates.get(gameId);
      if (!gameState.players[nombre]) {
        gameState.players[nombre] = {
          selectedCards: new Set(),
          timestamp: Date.now()
        };
      }

      const playerState = gameState.players[nombre];
      if (selected) {
        playerState.selectedCards.add(cartaId);
      } else {
        playerState.selectedCards.delete(cartaId);
      }
      
      // Emitir actualización del estado del juego
      io.emit('estadoJuego', {
        gameId,
        players: Object.fromEntries(
          Object.entries(gameState.players).map(([name, state]) => [
            name,
            {
              selectedCards: Array.from(state.selectedCards),
              timestamp: state.timestamp
            }
          ])
        )
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    if (currentUser) {
      const userData = tokensValidos.get(currentUser.token);
      if (userData) {
        userData.socketId = null;
        const gameState = gameStates.get(userData.gameId);
        
        if (gameState) {
          // Notificar a otros jugadores
          socket.to(userData.gameId).emit('playerDisconnected', {
            user: userData.nombre
          });
        }
      }
    }
    
    // Limpiar datos del socket
    for (const [token, data] of tokensValidos) {
      if (data.socketId === socket.id) {
        data.socketId = null;
      }
    }
  });
});

// Initialize server
const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
async function startServer() {
  try {
    // Inicializar la base de datos
    await initializeDatabase();
    
    // Iniciar el servidor una vez que la base de datos está lista
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();