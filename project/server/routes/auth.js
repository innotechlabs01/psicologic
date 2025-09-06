import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/user.js';
import Payment from '../models/payment.js';
const router = express.Router();
const SECRET_KEY = 'your-secret-key';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);
  const link = `/user-page/${uuidv4()}`;
  try {
    const user = await User.create({ name, email, password: hashedPass, link, createdAt: new Date() });
    await Payment.create({ 
      paymentId: uuidv4(), 
      userId: user.id, 
      amount: parseFloat(100000), 
      status: 'approved', 
      paymentDate: new Date(), 
      nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
      blockedPaymentDate: new Date(Date.now() + (15 + 5) * 24 * 60 * 60 * 1000), 
      createdAt: new Date(), 
    });
    res.json({ message: 'Registrado con éxito', link: user.link });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'El email ya existe' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email, suspended: false } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  if (user.suspended) return res.status(403).json({ message: 'Cuenta suspendida' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '4500s' }); // 1h15m
  res.json({ token, link: user.link, role: user.role, user: { name: user.name, suspense: user.suspended, id: user.id } });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ role: decoded.role });
  } catch (error) {
    res.status(403).json({ message: 'Token inválido' });
  }
});

export default router;
