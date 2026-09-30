import { connectDB } from './database.js';
import User from './models/User.js';
import Book from './models/Book.js';
import Loan from './models/Loan.js';
import { hashPassword } from './utils/password.js';

/**
 * Migration / initialisation du schéma MongoDB.
 * - Crée les index nécessaires (unicité email, recherche titre/auteur, etc.)
 * - Hache les éventuels mots de passe encore en clair
 * - Répare la cohérence livre / emprunt
 */
export async function migrate() {
  await connectDB();

  // --- Index ---
  await User.init();
  await Book.init();
  await Loan.init();

  // --- Migration des mots de passe ---
  // Les anciennes données étaient stockées en clair : on les hache maintenant.
  const plainUsers = await User.find({ password: { $not: /^\$2[aby]\$/ } });
  if (plainUsers.length > 0) {
    for (const user of plainUsers) {
      const hashed = await hashPassword(user.password);
      user.password = hashed;
      await user.save();
    }
    console.log(`✓ ${plainUsers.length} mot(s) de passe haché(s) avec bcrypt`);
  } else {
    console.log('✓ Aucun mot de passe en clair à migrer');
  }

  // --- Réparation de la cohérence livre / emprunt ---
  // Invariant : un livre porté par un emprunt non retourné est « Emprunté »,
  // tous les autres sont « Disponible ».
  const desynced = await Book.aggregate([
    {
      $lookup: {
        from: 'loans',
        localField: '_id',
        foreignField: 'bookId',
        as: 'loans',
      },
    },
    {
      $match: {
        status: { $ne: 'Emprunté' },
        'loans.status': { $ne: 'Retourné' },
      },
    },
    { $project: { _id: 1 } },
  ]);

  for (const book of desynced) {
    await Book.updateOne({ _id: book._id }, { $set: { status: 'Emprunté' } });
  }

  const orphanBooks = await Book.aggregate([
    {
      $lookup: {
        from: 'loans',
        localField: '_id',
        foreignField: 'bookId',
        as: 'loans',
      },
    },
    {
      $match: {
        status: 'Emprunté',
        $or: [
          { loans: { $size: 0 } },
          { loans: { $not: { $elemMatch: { status: { $ne: 'Retourné' } } } } },
        ],
      },
    },
    { $project: { _id: 1 } },
  ]);

  for (const book of orphanBooks) {
    await Book.updateOne({ _id: book._id }, { $set: { status: 'Disponible' } });
  }

  if (desynced.length || orphanBooks.length) {
    console.log(`✓ Cohérence réparée : ${desynced.length} livre(s) remis en « Emprunté », ${orphanBooks.length} remis en « Disponible »`);
  } else {
    console.log('✓ Cohérence livres / emprunts déjà correcte');
  }

  console.log('✓ Migration terminée avec succès');
}

// Exécution directe : `node src/migrate.js`
const isMainModule = process.argv[1]
  && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());

if (isMainModule) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Erreur de migration :', err);
      process.exit(1);
    });
}