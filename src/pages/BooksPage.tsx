import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { BookModal } from '../components/books/BookModal';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageTitle } from '../components/common/PageTitle';
import { TablePagination } from '../components/common/TablePagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AdminLayout } from '../components/layout/AdminLayout';
import type { Book } from '../types/library';
import { useLibrary } from '../state/LibraryContext';
import { useToast } from '../state/ToastContext';

export function BooksPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const { books, addBook, updateBook, deleteBook } = useLibrary();
  const { showToast } = useToast();

  const filteredBooks = books.filter(book =>
    `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  const visibleBooks = filteredBooks.slice((page - 1) * 5, page * 5);

  async function saveBook(bookData: Pick<Book, 'title' | 'author' | 'category' | 'status' | 'coverImage'>) {
    try {
      if (editingBook?.id) await updateBook(editingBook.id, bookData);
      else await addBook(bookData);
      showToast(editingBook ? 'Le livre a été modifié.' : 'Le livre a été ajouté au catalogue.');
      setIsModalOpen(false);
      setEditingBook(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Une erreur est survenue', 'error');
    }
  }

  function editBook(book: Book) { setEditingBook(book); setIsModalOpen(true); }
  function removeBook(book: Book) { setBookToDelete(book); }
  async function confirmDelete() {
    if (!bookToDelete) return;
    try {
      await deleteBook(bookToDelete.id ?? '');
      showToast('Le livre a été supprimé.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Une erreur est survenue', 'error');
    } finally {
      setBookToDelete(null);
    }
  }

  return <AdminLayout><PageTitle title="Catalogue des livres" subtitle="Gérez les ouvrages de votre bibliothèque." action={<Button icon={<Plus size={15} />} onClick={() => { setEditingBook(null); setIsModalOpen(true); }}>Ajouter un livre</Button>} /><section className="content-card"><div className="card-filter"><label className="inline-search"><Search size={15} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un livre..." aria-label="Rechercher un livre" /></label><span className="result-count">Total : {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''}</span></div><div className="table-region"><div className="table-wrap"><table className="table-books"><thead><tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Disponibilité</th><th>Actions</th></tr></thead><tbody>{visibleBooks.map(book => <tr key={book.id ?? book.title}><td>{book.coverImage ? <img className="book-thumb book-thumb-image" src={book.coverImage} alt={`Couverture de ${book.title}`} /> : <span className={`book-thumb cover-${book.cover}`}>{book.title.slice(0, 1)}</span>}{book.title}</td><td>{book.author}</td><td>{book.category}</td><td><Badge tone={book.status === 'Disponible' ? 'green' : 'red'}>{book.status}</Badge></td><td><span className="row-actions"><button type="button" aria-label={`Modifier ${book.title}`} onClick={() => editBook(book)}><Pencil size={14} /></button><button type="button" className="delete" aria-label={`Supprimer ${book.title}`} onClick={() => removeBook(book)}><Trash2 size={14} /></button></span></td></tr>)}</tbody></table></div><TablePagination total={filteredBooks.length} itemLabel="livre" page={page} onPageChange={setPage} /></div></section><BookModal open={isModalOpen} initialData={editingBook} onClose={() => { setIsModalOpen(false); setEditingBook(null); }} onSubmit={saveBook} /><ConfirmDialog open={Boolean(bookToDelete)} title="Supprimer ce livre ?" message={bookToDelete ? `« ${bookToDelete.title} » sera retiré du catalogue.` : ''} confirmLabel="Supprimer" onCancel={() => setBookToDelete(null)} onConfirm={confirmDelete} /></AdminLayout>;
}
