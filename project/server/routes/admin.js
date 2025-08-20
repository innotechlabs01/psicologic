import express from 'express';
import User from '../models/user.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';
const router = express.Router();

// Obtener todos los usuarios
router.get('/users', authenticate, isAdmin, async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'email', 'link', 'name', 'suspended'] });
  if (users) {
    res.json(users);
  } else {
    res.json({ message: 'No se encontraron usuarios' });
  }
});

// Obtener un usuario por email
router.get('/user/:email', authenticate, async (req, res) => {
  const user = await User.findOne({ where: { email: req.params.email } });
  if (user) {
    res.json({ user });
  } else {
    res.json({ message: 'Usuario no encontrado' });
  }
});

// Actualizar un usuario
router.put('/user/:id', authenticate, isAdmin, async (req, res) => {
  const { soporte_estable, suspended } = req.body;
  await User.update({ soporte_estable, suspended }, { where: { id: req.params.id } });
  res.json({ message: 'Usuario actualizado' });
});

export default router;
