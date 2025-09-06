import jwt from 'jsonwebtoken';
import Payment from '../models/payment.js';

const SECRET_KEY = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key' : null);
const PUBLIC_ROUTES = ['/', '/index.html', '/register.html'];
const MAX_TOKEN_AGE_MS = 75 * 60 * 1000; // 1 hora y 15 minutos en milisegundos

const sendErrorResponse = (res, status, message) => {
  console.error(`❌ ${message} | Status: ${status} | Path: ${res.req?.path || 'unknown'}`);
  return res.status(status).json({ error: message });
};

export function authenticateGameToken(tokensValidos = new Map()) {
  return (req, res, next) => {
    const token = req.query.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ error: 'Token de juego requerido' });
    }

    if (!tokensValidos.has(token)) {
      return res.status(403).json({ error: 'Token de juego inválido o expirado' });
    }

    req.gameData = tokensValidos.get(token);
    next();
  };
}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
   // Validar antigüedad del token
    const issuedAt = decoded.iat * 1000; // Convertir a milisegundos
    const now = Date.now();
    const age = now - issuedAt;

    if (age > MAX_TOKEN_AGE_MS) {
      console.warn(`⏰ Token demasiado antiguo: ${Math.floor(age / 60000)} minutos`);
      return res.status(403).json({ error: 'Token expirado por antigüedad (más de 1h15m)' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Token inválido:', err.message);
    res.status(403).json({ error: 'Token inválido' });
  }
}


export function authenticate(tokensValidos = new Map()) {
  return async (req, res, next) => {
    if (!SECRET_KEY) {
      return sendErrorResponse(res, 500, 'Configuración del servidor inválida (JWT_SECRET faltante)');
    }

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const queryToken = req.query.token;
    const token = bearerToken || queryToken;

    console.debug(`🔐 Autenticando ruta: ${req.path} | Token presente: ${!!token}`);

    // Rutas públicas
    if (PUBLIC_ROUTES.some(route => req.path.startsWith(route))) {
      console.log(`🔓 Acceso permitido a ruta pública: ${req.path}`);
      return next();
    }

    // Validación de token de juego
    if (req.path.startsWith('/games/') || req.path.startsWith('/api/games/')) {
      if (!token) {
        return sendErrorResponse(res, 403, 'Token de juego requerido');
      }

      if (!tokensValidos.has(token)) {
        return sendErrorResponse(res, 403, 'Token de juego inválido o expirado');
      }

      req.gameData = tokensValidos.get(token);
      console.log(`🎮 Token de juego válido para ruta: ${req.path}`);
      return next();
    }

    // Validación JWT estándar
    if (!token) {
      return sendErrorResponse(res, 401, 'Token de autorización no proporcionado');
    }

    // Si el token es válido en el mapa de tokens (juegos), permitir acceso
    if (tokensValidos.has(token)) {
      console.log(`✅ Token válido desde mapa para ruta: ${req.path}`);
      return next();
    }

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      console.debug(`✅ JWT verificado: ${decoded.email} | Rol: ${decoded.role}`);
      return next();
    } catch (err) {
      console.error(`❌ Error al verificar JWT: ${err.message}`);
      return sendErrorResponse(res, 403, 'Token JWT inválido');
    }
  };
}

export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador' });
  }

  console.log(`🛡️ Acceso de administrador: ${req.user.email}`);
  next();
}

