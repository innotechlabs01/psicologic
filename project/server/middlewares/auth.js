import jwt from 'jsonwebtoken';
const SECRET_KEY = 'your-secret-key';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // Permitir acceso a index.html y register.html sin token
    if (['/', '/index.html', '/register.html'].includes(req.path)) {
      return next();
    }
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    // Permitir acceso a index.html y register.html si el token es inválido
    if (['/', '/index.html', '/register.html'].includes(req.path)) {
      return next();
    }
    res.status(403).json({ message: 'Token inválido' });
  }
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  next();
}

export { authenticate, isAdmin };
