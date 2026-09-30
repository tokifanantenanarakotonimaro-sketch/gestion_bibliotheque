import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { Book } from '../../types/library';

type BookTableProps = {
  rows: Book[];
  compact?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
};

export function BookTable({ rows, compact = false, onEdit, onDelete }: BookTableProps) {
  return <div className="table-wrap"><table className={`table-books ${compact ? 'table-compact' : ''}`}><thead><tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Disponibilité</th><th>{compact ? 'Date ajout' : 'Actions'}</th></tr></thead><tbody>{rows.map(book => <tr key={book.id ?? book.title}><td>{book.coverImage ? <img className="book-thumb book-thumb-image" src={book.coverImage} alt={`Couverture de ${book.title}`} /> : <span className={`book-thumb cover-${book.cover}`}>{book.title.slice(0, 1)}</span>}{book.title}</td><td>{book.author}</td><td>{book.category}</td><td><Badge tone={book.status === 'Disponible' ? 'green' : 'red'}>{book.status}</Badge></td><td>{compact ? book.date : <span className="row-actions"><button type="button" aria-label={`Modifier ${book.title}`} onClick={() => onEdit?.(book)}><Pencil size={14} /></button><button type="button" className="delete" aria-label={`Supprimer ${book.title}`} onClick={() => onDelete?.(book)}><Trash2 size={14} /></button></span>}</td></tr>)}</tbody></table></div>;
}
