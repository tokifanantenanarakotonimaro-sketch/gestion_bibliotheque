import { Router } from 'express';
import Book from '../models/Book.js';
import Loan from '../models/Loan.js';
import { validateBook } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/auth.js';

const router = Router();

// GET /api/books - Liste tous les livres avec recherche et filtres
router.get('/', asyncHandler(async (req, res) => {
  const { search, category, status } = req.query;

  const filter = {};

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: regex }, { author: regex }];
  }

  if (category && category !== 'Toutes les catégories') {
    filter.category = category;
  }

  if (status && status !== 'Tous') {
    filter.status = status;
  }

  const books = await Book.find(filter).sort({ date: -1 });
  res.json(books);
}));

// GET /api/books/categories - Liste toutes les catégories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Book.distinct('category');
  categories.sort((a, b) => a.localeCompare(b));
  res.json(categories);
}));

// GET /api/books/:id - Récupère un livre par ID
router.get('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({ error: 'Livre non trouvé' });
  }

  res.json(book);
}));

// POST /api/books - Crée un nouveau livre
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const validated = validateBook(req.body);

  const id = `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().slice(0, 10);

  const book = await Book.create({
    _id: id,
    title: validated.title,
    author: validated.author,
    category: validated.category,
    status: validated.status,
    date: today,
    cover: '✦',
    coverImage: validated.coverImage,
  });

  res.status(201).json(book);
}));

// PUT /api/books/:id - Met à jour un livre
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await Book.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Livre non trouvé' });
  }

  const validated = validateBook({ ...existing.toObject(), ...req.body });

  const book = await Book.findByIdAndUpdate(
    req.params.id,
    {
      title: validated.title,
      author: validated.author,
      category: validated.category,
      status: validated.status,
      coverImage: validated.coverImage,
    },
    { returnDocument: 'after' },
  );

  res.json(book);
}));

// DELETE /api/books/:id - Supprime un livre
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await Book.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: 'Livre non trouvé' });
  }

  // Vérifier si le livre est en cours d'emprunt
  const activeLoan = await Loan.findOne({
    bookId: req.params.id,
    status: { $ne: 'Retourné' },
  });

  if (activeLoan) {
    return res.status(409).json({ error: 'Impossible de supprimer un livre en cours d\'emprunt' });
  }

  await Book.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Livre supprimé avec succès' });
}));

export default router;