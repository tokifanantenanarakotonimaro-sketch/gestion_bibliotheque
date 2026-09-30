import { Router } from 'express';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import { validateUser } from '../middleware/validate.js';
import { asyncHandler, requireAdmin, requireAuth } from '../middleware/auth.js';
import { hashPassword } from '../utils/password.js';
import { mapLoan } from '../utils/loan.js';

const router = Router();

// Consultation réservée aux utilisateurs connectés,
// gestion des comptes réservée aux administrateurs (voir plus bas).
router.use(requireAuth);

// GET /api/users - Liste tous les utilisateurs
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find().sort({ joinedAt: -1 });
  res.json(users);
}));

// GET /api/users/:id - Récupère un utilisateur par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  res.json(user);
}));

// POST /api/users - Crée un nouvel utilisateur
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const validated = validateUser(req.body);

  // Vérifier si l'email existe déjà
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

  res.status(201).json(user);
}));

// GET /api/users/:id/loans - Historique complet des emprunts d'un utilisateur
// (emprunts en cours + emprunts retournés)
router.get('/:id/loans', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const loans = await Loan.find({ userId: req.params.id })
    .sort({ start: -1, _id: -1 })
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  res.json(loans.map(mapLoan));
}));

// PUT /api/users/:id - Met à jour un utilisateur
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await User.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const { name, email, role, status } = req.body;

  if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Le nom est obligatoire' });
  }

  if (email !== undefined && (!email || typeof email !== 'string' || !email.includes('@'))) {
    return res.status(400).json({ error: 'L\'adresse e-mail doit être valide' });
  }

  if (role !== undefined && !['Administrateur', 'Lecteur'].includes(role)) {
    return res.status(400).json({ error: 'Le rôle doit être Administrateur ou Lecteur' });
  }

  if (status !== undefined && !['Actif', 'Inactif'].includes(status)) {
    return res.status(400).json({ error: 'Le statut doit être Actif ou Inactif' });
  }

  // Vérifier si l'email existe déjà pour un autre utilisateur
  if (email && email !== existing.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (emailExists) {
      return res.status(409).json({ error: 'Cette adresse e-mail existe déjà' });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: name || existing.name,
      email: email || existing.email,
      role: role || existing.role,
      status: status || existing.status,
    },
    { returnDocument: 'after' },
  );

  res.json(user);
}));

// DELETE /api/users/:id - Supprime un utilisateur
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await User.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  // Vérifier si l'utilisateur a des emprunts en cours
  const activeLoans = await Loan.countDocuments({
    userId: req.params.id,
    status: { $ne: 'Retourné' },
  });

  if (activeLoans > 0) {
    return res.status(409).json({ error: 'Impossible de supprimer un utilisateur avec des emprunts en cours' });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
}));

export default router;