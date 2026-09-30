import { Save, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Book, LibraryUser } from '../../types/library';

type LoanModalProps = { open: boolean; books: Book[]; users: LibraryUser[]; onClose: () => void; onSubmit: (bookId: string, userId: string, start: string, due: string) => string | null | Promise<string | null> };

export function LoanModal({ open, books, users, onClose, onSubmit }: LoanModalProps) {
  const [bookId, setBookId] = useState('');
  const [userId, setUserId] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [due, setDue] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setBookId(books[0]?.id ?? ''); setUserId(users[0]?.id ?? ''); setError(''); } }, [open, books, users]);
  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await onSubmit(bookId, userId, start, due);
      if (result) { setError(result); return; }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="book-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-heading"><div><h2>Enregistrer un emprunt</h2><p>Associez un livre disponible à un utilisateur.</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button></div><form className="book-form" onSubmit={submit}>{error && <p className="form-error" role="alert">{error}</p>}<label>Livre<select value={bookId} onChange={event => setBookId(event.target.value)} required>{books.length ? books.map(book => <option key={book.id} value={book.id}>{book.title} — {book.author}</option>) : <option value="">Aucun livre disponible</option>}</select></label><label>Utilisateur<select value={userId} onChange={event => setUserId(event.target.value)} required>{users.map(user => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}</select></label><div className="book-form-grid"><label>Date d’emprunt<input type="date" value={start} onChange={event => setStart(event.target.value)} required /></label><label>Date d’échéance<input type="date" value={due} onChange={event => setDue(event.target.value)} required /></label></div><div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Annuler</button><button type="submit" className="button button-primary" disabled={!books.length || busy}><Save size={15} />{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div></form></div></div>;
}