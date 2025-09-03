import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateGameToken, authenticateJWT } from '../../middlewares/auth.js'; // Ajusta la ruta según tu estructura

const router = Router();

export default function gameRoutes(tokensValidos) {
  // Endpoint para generar enlaces
  router.get('/generar-enlaces', authenticateJWT, (req, res) => {
    console.log('Procesando /api/games/generar-enlaces', { query: req.query, user: req.user });
    try {
      const nombre1 = req.query.nombre1 || 'Jugador 1';
      const nombre2 = req.query.nombre2 || 'Jugador 2';
      const juego = req.query.juego;
      const gameId = uuidv4(); // Generar un ID único para el juego
      
      // Generar tokens con información del juego
      const token1 = uuidv4();
      const token2 = uuidv4();
      
      // Almacenar información completa del juego
      tokensValidos.set(token1, { 
        nombre: nombre1, 
        socketId: null, 
        gameId,
        juego,
        createdAt: new Date().toISOString()
      });
      
      tokensValidos.set(token2, { 
        nombre: nombre2, 
        socketId: null,
        gameId,
        juego,
        createdAt: new Date().toISOString()
      });

      // Construir URLs con los tokens
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const enlace1 = `${baseUrl}/games/cartas.html?token=${token1}&juego=${juego}`;
      const enlace2 = `${baseUrl}/games/cartas.html?token=${token2}&juego=${juego}`;

      console.log('Enlaces generados:', { 
        gameId, 
        token1: token1.substring(0, 8) + '...', 
        token2: token2.substring(0, 8) + '...',
        juego
      });

      res.json({ 
        enlace1, 
        enlace2, 
        token1, 
        token2, 
        nombre1, 
        nombre2, 
        juego,
        gameId 
      });
    } catch (err) {
      console.error('Error en /generar-enlaces:', err.message);
      res.status(500).json({ error: 'Error al generar enlaces' });
    }
  });

  // Endpoint para validar token
  router.get('/validar-token', authenticateGameToken(tokensValidos), (req, res) => {
    console.log('Procesando /api/games/validar-token', { query: req.query });
    const token = req.query.token;
    if (tokensValidos.has(token)) {
      res.json({ valido: true, nombre: tokensValidos.get(token).nombre });
    } else {
      res.json({ valido: false });
    }
  });

  return router;
}