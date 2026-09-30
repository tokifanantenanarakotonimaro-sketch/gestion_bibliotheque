import { BookOpen, BookOpenCheck, Check, Clock3, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { PageTitle } from '../components/common/PageTitle';
import { StatCard } from '../components/common/StatCard';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useLibrary } from '../state/LibraryContext';

export function DashboardPage() {
  const { books, users, loans, history, profile } = useLibrary();
  const today = new Date().toISOString().slice(0, 10);
  const recentBooks = [...books].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return <AdminLayout><PageTitle title={`Bonjour, ${profile.name} !`} subtitle="Voici un aperçu de votre bibliothèque." /><div className="stats-grid"><StatCard tone="gold" icon={<BookOpen size={20} />} label="Total des livres" value={String(books.length)} /><StatCard tone="orange" icon={<Users size={20} />} label="Utilisateurs" value={String(users.length)} /><StatCard tone="blue" icon={<Clock3 size={20} />} label="Emprunts en cours" value={String(loans.length)} /><StatCard tone="green" icon={<Check size={20} />} label="Retours aujourd'hui" value={String(history.filter(item => item.end === today).length)} /></div><section className="content-card"><div className="section-heading"><h2>Derniers livres ajoutés</h2><Link to="/admin/books">Voir tout <BookOpenCheck size={14} /></Link></div><div className="table-wrap"><table className="table-books table-compact"><thead><tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Disponibilité</th><th>Date ajout</th></tr></thead><tbody>{recentBooks.map(book => <tr key={book.id ?? book.title}><td>{book.coverImage ? <img className="book-thumb book-thumb-image" src={book.coverImage} alt={`Couverture de ${book.title}`} /> : <span className={`book-thumb cover-${book.cover}`}>{book.title.slice(0, 1)}</span>}{book.title}</td><td>{book.author}</td><td>{book.category}</td><td><Badge tone={book.status === 'Disponible' ? 'green' : 'red'}>{book.status}</Badge></td><td>{book.date}</td></tr>)}</tbody></table></div></section></AdminLayout>;
}
