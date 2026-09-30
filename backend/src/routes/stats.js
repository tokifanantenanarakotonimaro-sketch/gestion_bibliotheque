import { Router } from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import { asyncHandler } from '../middleware/auth.js';

const router = Router();

const today = () => new Date().toISOString().slice(0, 10);

// GET /api/stats - Statistiques du tableau de bord
router.get('/', asyncHandler(async (req, res) => {
  const currentDate = today();

  const [
    books,
    booksAvailable,
    booksBorrowed,
    users,
    activeLoans,
    overdueLoans,
    returnedLoans,
    returnsToday,
  ] = await Promise.all([
    Book.countDocuments(),
    Book.countDocuments({ status: 'Disponible' }),
    Book.countDocuments({ status: 'Emprunté' }),
    User.countDocuments(),
    Loan.countDocuments({ status: { $ne: 'Retourné' } }),
    Loan.countDocuments({ status: { $ne: 'Retourné' }, due: { $lt: currentDate } }),
    Loan.countDocuments({ status: 'Retourné' }),
    Loan.countDocuments({ returnedAt: currentDate }),
  ]);

  const stats = {
    books,
    booksAvailable,
    booksBorrowed,
    users,
    activeLoans,
    overdueLoans,
    returnedLoans,
    returnsToday,
    date: currentDate,
  };

  res.json(stats);
}));

export default router;