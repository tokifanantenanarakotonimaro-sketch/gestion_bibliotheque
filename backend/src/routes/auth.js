import { Router } from 'express';
import User from '../models/User.js';
import { validateLogin, validateUser } from '../middleware/validate.js';
import { asyncHandler, requireAuth } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/token.js';

const router = Router();

// Champs publics d'un utilisateur (jamais le mot de passe)
function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/login - Connexion
router.post('/login', asyncHandler(async (req, res) => {
  const validated = validateLogin(req.body);

  const user = await User.findOne({ email: validated.email });

  if (!user || !(await verifyPassword(validated.password, user.password))) {
    return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect' });
  }

  if (user.status !== 'Actif') {
    return res.status(403).json({ error: 'Ce compte est inactif' });
  }

  // Migration opportuniste : si le mot de passe est encore en clair, on le hache.
  if (user.password && !/^\$2[aby]\$/.test(user.password)) {
    const hashed = await hashPassword(user.password);
    user.password = hashed;
    await user.save();
  }

  res.json({
    token: signToken(user),
    user: publicUser(user.toJSON()),
    message: 'Connexion réussie',
  });
}));

// POST /api/auth/register - Inscription
router.post('/register', asyncHandler(async (req, res) => {
  const validated = validateUser(req.body);

  const existing = await User.findOne({ email: validated.email });
  if (existing) {
    return res.status(409).json({ error: 'Cette adresse e-mail existe déjà' });
  }

  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().slice(0, 10);
  const hashedPassword = await hashPassword(validated.password);

  const user = await User.create({
    _id: id,
    name: validated.name,
    email: validated.email,
    password: hashedPassword,
    role: 'Lecteur',
    status: 'Actif',
    joinedAt: today,
  });

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user.toJSON()),
    message: 'Inscription réussie',
  });
}));

// GET /api/auth/profile - Profil de l'utilisateur connecté
router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  res.json(user);
}));

// PUT /api/auth/profile - Met à jour le profil de l'utilisateur connecté
router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Le nom est obligatoire' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'L\'adresse e-mail doit être valide' });
  }

  const existing = await User.findById(req.user.id);
  if (!existing) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  // Unicité de l'adresse e-mail
  const duplicate = await User.findOne({
    email: email.trim().toLowerCase(),
    _id: { $ne: req.user.id },
  });
  if (duplicate) {
    return res.status(409).json({ error: 'Cette adresse e-mail existe déjà' });
  }

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    },
    { returnDocument: 'after' },
  );

  res.json({ ...updated.toJSON(), message: 'Profil mis à jour' });
}));

// PUT /api/auth/profile/password - Change le mot de passe de l'utilisateur connecté
router.put('/profile/password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({ error: 'Le mot de passe actuel est obligatoire' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  if (!(await verifyPassword(currentPassword, user.password))) {
    return res.status(401).json({ error: 'Le mot de passe actuel est incorrect' });
  }

  const hashed = await hashPassword(password);
  user.password = hashed;
  await user.save();

  res.json({ success: true, message: 'Mot de passe mis à jour' });
}));

export default router;