import { Router } from 'express';
import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import User from '../models/User.js';
import { validateLoan } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/auth.js';
import { mapLoan } from '../utils/loan.js';
import { supportsTransactions } from '../database.js';

const router = Router();

// Toutes les routes d'emprunt nécessitent un utilisateur connecté
router.use(requireAuth);

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Exécute des opérations MongoDB de manière transactionnelle si possible,
 * sinon en mode dégradé (MongoDB standalone sans replica set).
 */
async function withTransaction(operations) {
  if (await supportsTransactions()) {
    const session = await Loan.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await operations(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
  // Fallback : pas de transaction (atomicité non garantie)
  return operations(null);
}

// GET /api/loans - Emprunts en cours
// Query : ?userId=xxx  ?bookId=xxx  ?overdue=true  ?status=En retard|En cours
router.get('/', asyncHandler(async (req, res) => {
  const { userId, bookId, overdue, status } = req.query;

  const filter = { status: { $ne: 'Retourné' } };

  if (userId) filter.userId = userId;
  if (bookId) filter.bookId = bookId;

  if (overdue === 'true') {
    filter.due = { $lt: today() };
  }

  if (status) {
    filter.status = status;
  }

  const loans = await Loan.find(filter)
    .sort({ due: 1, start: -1 })
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  res.json(loans.map(mapLoan));
}));

// GET /api/loans/history - Historique des emprunts
// Query : ?userId=xxx  ?scope=returned|active|all   (défaut : returned)
router.get('/history', asyncHandler(async (req, res) => {
  const { userId, scope } = req.query;

  const filter = {};
  const effectiveScope = ['returned', 'active', 'all'].includes(scope) ? scope : 'returned';

  if (effectiveScope === 'returned') {
    filter.status = 'Retourné';
  } else if (effectiveScope === 'active') {
    filter.status = { $ne: 'Retourné' };
  }

  if (userId) {
    filter.userId = userId;
  }

  const sort = effectiveScope === 'active'
    ? { due: 1 }
    : { returnedAt: -1, start: -1 };

  const loans = await Loan.find(filter)
    .sort(sort)
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  res.json(loans.map(mapLoan));
}));

// GET /api/loans/overdue - Emprunts en retard
router.get('/overdue', asyncHandler(async (req, res) => {
  const loans = await Loan.find({
    status: { $ne: 'Retourné' },
    due: { $lt: today() },
  })
    .sort({ due: 1 })
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  res.json(loans.map(mapLoan));
}));

// GET /api/loans/:id - Récupère un emprunt par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id)
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  if (!loan) {
    return res.status(404).json({ error: 'Emprunt non trouvé' });
  }

  res.json(mapLoan(loan));
}));

// POST /api/loans - Crée un nouvel emprunt
router.post('/', asyncHandler(async (req, res) => {
  const validated = validateLoan(req.body);

  // Vérifier que le livre existe
  const book = await Book.findById(validated.bookId);
  if (!book) {
    return res.status(404).json({ error: 'Livre non trouvé' });
  }

  // Vérifier que le livre est disponible
  if (book.status !== 'Disponible') {
    return res.status(409).json({ error: 'Ce livre n\'est pas disponible' });
  }

  // Vérifier que l'utilisateur existe
  const user = await User.findById(validated.userId);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  // Vérifier que l'utilisateur est actif
  if (user.status !== 'Actif') {
    return res.status(409).json({ error: 'Ce compte utilisateur est inactif' });
  }

  const id = `loan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const status = validated.due < today() ? 'En retard' : 'En cours';

  // Créer l'emprunt et mettre à jour le statut du livre
  const loan = await withTransaction(async (session) => {
    const [created] = await Loan.create([{
      _id: id,
      bookId: validated.bookId,
      userId: validated.userId,
      start: validated.start,
      due: validated.due,
      status,
    }], session ? { session } : undefined);

    await Book.updateOne(
      { _id: validated.bookId },
      { $set: { status: 'Emprunté' } },
      session ? { session } : undefined,
    );

    return created;
  });

  const populated = await Loan.findById(loan._id)
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  res.status(201).json(mapLoan(populated));
}));

// POST /api/loans/:id/return - Retourne un emprunt
router.post('/:id/return', asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    return res.status(404).json({ error: 'Emprunt non trouvé' });
  }

  if (loan.status === 'Retourné') {
    return res.status(409).json({ error: 'Cet emprunt a déjà été retourné' });
  }

  const returnedAt = today();

  // Mettre à jour l'emprunt et le statut du livre
  await withTransaction(async (session) => {
    await Loan.updateOne(
      { _id: req.params.id },
      { $set: { status: 'Retourné', returnedAt } },
      session ? { session } : undefined,
    );

    await Book.updateOne(
      { _id: loan.bookId },
      { $set: { status: 'Disponible' } },
      session ? { session } : undefined,
    );
  });

  const updatedLoan = await Loan.findById(req.params.id)
    .populate('bookId', 'title author')
    .populate('userId', 'name email');

  res.json(mapLoan(updatedLoan));
}));

export default router;