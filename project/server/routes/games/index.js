// routes/paymentRoutes.js
import express  from "express";
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

// Endpoint para generar dos enlaces
router.get('/generar-enlaces', authenticate, (req, res) => {
  const nombre1 = req.query.nombre1 || 'Jugador 1';
  const nombre2 = req.query.nombre2 || 'Jugador 2';
  const token1 = uuidv4();
  const token2 = uuidv4();
  tokensValidos.set(token1, { nombre: nombre1, socketId: null });
  tokensValidos.set(token2, { nombre: nombre2, socketId: null });
  const enlace1 = `http://localhost:3000/user.html?token=${token1}`;
  const enlace2 = `http://localhost:3000/user.html?token=${token2}`;
  res.json({ enlace1, enlace2, token1, token2, nombre1, nombre2 });
});

// Endpoint para validar token
router.get('/validar-token', authenticate, (req, res) => {
  const token = req.query.token;
  if (tokensValidos.has(token)) {
    res.json({ valido: true, nombre: tokensValidos.get(token).nombre });
  } else {
    res.json({ valido: false });
  }
});

export default router;