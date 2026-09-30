import { connectDB } from './database.js';
import User from './models/User.js';
import Book from './models/Book.js';
import Loan from './models/Loan.js';
import { hashPassword } from './utils/password.js';

/**
 * Données initiales de démonstration.
 * - Ne crée les comptes que si la collection users est vide
 * - Ne crée les livres/emprunts que si la collection books est vide
 * - Garantit toujours la présence du compte administrateur
 */
export async function seed() {
  await connectDB();

  const existingUsers = await User.countDocuments();
  const existingBooks = await Book.countDocuments();
  const hasAdmin = await User.exists({ email: 'admin@bibliotheque.com' });

  const seedDemoData = existingBooks === 0;
  const seedUsers = existingUsers === 0;
  const ensureAdmin = !hasAdmin;

  if (!seedDemoData && !seedUsers && !ensureAdmin) {
    console.log('✓ Données déjà présentes, seed ignoré');
    return;
  }

  if (!seedDemoData) {
    console.log('  ↳ catalogue déjà rempli : livres et emprunts non touchés');
  }

  // --- Données initiales ---
  const users = [
    { _id: 'user-admin', name: 'Admin', email: 'admin@bibliotheque.com', password: 'admin123', role: 'Administrateur', status: 'Actif', joinedAt: '2025-01-01' },
    { _id: 'user-marie', name: 'Marie Dupont', email: 'marie.dupont@example.com', password: 'Lecteur123!', role: 'Lecteur', status: 'Actif', joinedAt: '2025-01-10' },
    { _id: 'user-jean', name: 'Jean Martin', email: 'jean.martin@example.com', password: 'Lecteur123!', role: 'Lecteur', status: 'Actif', joinedAt: '2025-01-12' },
    { _id: 'user-sophie', name: 'Sophie Bernard', email: 'sophie.bernard@example.com', password: 'Lecteur123!', role: 'Lecteur', status: 'Actif', joinedAt: '2025-01-15' },
    { _id: 'user-lucas', name: 'Lucas Moreau', email: 'lucas.moreau@example.com', password: 'Lecteur123!', role: 'Lecteur', status: 'Actif', joinedAt: '2025-01-20' },
  ];

  const books = [
    { _id: 'book-1', title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', category: 'Roman', date: '2025-04-01', cover: '✦', coverImage: '/covers/cover_petit_prince_1790315060574.jpg' },
    { _id: 'book-2', title: '1984', author: 'George Orwell', category: 'Science-fiction', date: '2025-03-28', cover: '▦', coverImage: '/covers/cover_1984_orwell_1790315074791.jpg' },
    { _id: 'book-3', title: 'Dune', author: 'Frank Herbert', category: 'Science-fiction', date: '2025-03-25', cover: '◒', coverImage: '/covers/cover_dune_herbert_1790315089578.jpg' },
    { _id: 'book-4', title: 'Les Misérables', author: 'Victor Hugo', category: 'Classique', date: '2025-03-20', cover: '▤', coverImage: '/covers/cover_les_miserables_1790315103463.jpg' },
    { _id: 'book-5', title: "L'Étranger", author: 'Albert Camus', category: 'Philosophie', date: '2025-03-18', cover: '◈', coverImage: '/covers/cover_etranger_camus_1790315117186.jpg' },
  ];

  // Emprunts en cours : index du livre => lecteur
  const activeLoans = [
    { book: 0, user: 'user-marie', start: '2026-09-15', due: '2026-10-15' },
    { book: 1, user: 'user-jean', start: '2026-09-20', due: '2026-10-20' },
    { book: 2, user: 'user-sophie', start: '2026-09-25', due: '2026-10-25' },
    { book: 3, user: 'user-lucas', start: '2026-09-28', due: '2026-10-28' },
  ];

  // Emprunts déjà retournés (historique)
  const returnedLoans = [
    { book: 0, user: 'user-marie', start: '2026-03-01', end: '2026-03-15' },
    { book: 1, user: 'user-jean', start: '2026-02-20', end: '2026-03-05' },
    { book: 2, user: 'user-sophie', start: '2026-02-05', end: '2026-02-19' },
    { book: 3, user: 'user-lucas', start: '2025-12-10', end: '2025-12-19' },
    { book: 4, user: 'user-marie', start: '2026-01-08', end: '2026-01-22' },
  ];

  // --- Hachage des mots de passe ---
  const accountsToCreate = seedUsers
    ? users
    : users.filter(user => user.email === 'admin@bibliotheque.com');

  const usersWithHash = [];
  for (const user of accountsToCreate) {
    usersWithHash.push({ ...user, password: await hashPassword(user.password) });
  }

  // --- Insertion (idempotente) ---
  for (const user of usersWithHash) {
    await User.updateOne(
      { _id: user._id },
      { $setOnInsert: user },
      { upsert: true },
    );
  }

  if (seedDemoData) {
    // Livres : tous disponibles par défaut
    for (const book of books) {
      await Book.updateOne(
        { _id: book._id },
        { $setOnInsert: { ...book, status: 'Disponible' } },
        { upsert: true },
      );
    }

    // Emprunts en cours : le livre passe en « Emprunté »
    for (let i = 0; i < activeLoans.length; i++) {
      const loan = activeLoans[i];
      await Loan.updateOne(
        { _id: `loan-${i + 1}` },
        {
          $setOnInsert: {
            _id: `loan-${i + 1}`,
            bookId: books[loan.book]._id,
            userId: loan.user,
            start: loan.start,
            due: loan.due,
            status: 'En cours',
            returnedAt: null,
          },
        },
        { upsert: true },
      );
      await Book.updateOne(
        { _id: books[loan.book]._id },
        { $set: { status: 'Emprunté' } },
      );
    }

    // Emprunts retournés : historique
    for (let i = 0; i < returnedLoans.length; i++) {
      const loan = returnedLoans[i];
      await Loan.updateOne(
        { _id: `history-${i + 1}` },
        {
          $setOnInsert: {
            _id: `history-${i + 1}`,
            bookId: books[loan.book]._id,
            userId: loan.user,
            start: loan.start,
            due: loan.end,
            returnedAt: loan.end,
            status: 'Retourné',
          },
        },
        { upsert: true },
      );
    }
  }

  const created = {
    users: await User.countDocuments(),
    books: await Book.countDocuments(),
    loans: await Loan.countDocuments(),
  };

  console.log('✓ Seed terminé avec succès');
  console.log(`  - ${created.users} utilisateurs (admin : admin@bibliotheque.com / admin123)`);
  console.log(`  - ${created.books} livres`);
  console.log(`  - ${created.loans} emprunts (en cours + historique)`);
}

// Exécution directe : `node src/seed.js`
const isMainModule = process.argv[1]
  && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());

if (isMainModule) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Erreur de seed :', err);
      process.exit(1);
    });
}