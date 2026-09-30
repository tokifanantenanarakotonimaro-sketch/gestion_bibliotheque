const today = () => new Date().toISOString().slice(0, 10);

/**
 * Statut réel d'un emprunt, recalculé à la volée.
 * Le statut stocké en base peut être périmé (un emprunt « En cours » peut
 * maintenant être « En retard » sans avoir été modifié).
 * @param {{ status: string, due: string }} loan
 * @returns {'En cours' | 'En retard' | 'Retourné'}
 */
export function effectiveStatus(loan) {
  if (!loan) return 'En cours';
  if (loan.status === 'Retourné' || loan.returnedAt) return 'Retourné';
  return loan.due < today() ? 'En retard' : 'En cours';
}

/**
 * Transforme un document Mongoose d'emprunt (avec populate) en objet de l'API.
 * @param {object} row
 */
export function mapLoan(row) {
  const book = row.bookId || {};
  const user = row.userId || {};

  return {
    id: row._id,
    bookId: row.bookId?._id ?? row.bookId,
    userId: row.userId?._id ?? row.userId,
    title: book.title,
    author: book.author,
    user: user.name,
    email: user.email,
    start: row.start,
    due: row.due,
    returnedAt: row.returnedAt ?? null,
    end: row.returnedAt ?? null,
    status: effectiveStatus(row),
  };
}