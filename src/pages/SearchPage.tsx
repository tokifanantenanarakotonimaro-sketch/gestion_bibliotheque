import { Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PageTitle } from '../components/common/PageTitle';
import { TablePagination } from '../components/common/TablePagination';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useLibrary } from '../state/LibraryContext';

export function SearchPage() {
  const { books } = useLibrary();
  const [term, setTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('Toutes les catégories');
  const [availability, setAvailability] = useState('Tous');
  const result = books.filter(book => `${book.title} ${book.author}`.toLowerCase().includes(term.toLowerCase()) && (category === 'Toutes les catégories' || book.category === category) && (availability === 'Tous' || book.status === availability));
  const visibleResult = result.slice((page - 1) * 5, page * 5);

  return <AdminLayout><PageTitle title="Recherche de livres" subtitle="Trouvez rapidement un ouvrage dans le catalogue." /><section className="content-card search-card"><div className="search-form"><div className="inline-search"><Search size={15} /><input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Titre ou auteur..." /></div><Button onClick={() => { setTerm(searchInput); setPage(1); }}>Rechercher</Button></div><div className="select-row"><label>Catégorie<select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option>Toutes les catégories</option>{[...new Set(books.map(book => book.category))].map(item => <option key={item}>{item}</option>)}</select></label><label>Disponibilité<select value={availability} onChange={event => { setAvailability(event.target.value); setPage(1); }}><option>Tous</option><option>Disponible</option><option>Emprunté</option></select></label></div><h3>Résultats de recherche ({result.length})</h3><div className="table-region"><div className="table-wrap"><table className="table-books"><thead><tr><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>Disponibilité</th><th>Actions</th></tr></thead><tbody>{visibleResult.map(book => <tr key={book.id ?? book.title}><td>{book.coverImage ? <img className="book-thumb book-thumb-image" src={book.coverImage} alt={`Couverture de ${book.title}`} /> : <span className={`book-thumb cover-${book.cover}`}>{book.title.slice(0, 1)}</span>}{book.title}</td><td>{book.author}</td><td>{book.category}</td><td><Badge tone={book.status === 'Disponible' ? 'green' : 'red'}>{book.status}</Badge></td><td><span className="row-actions"></span></td></tr>)}</tbody></table></div>{!result.length && <p className="empty-state">Aucun résultat.</p>}<TablePagination total={result.length} itemLabel="livre" page={page} onPageChange={setPage} /></div></section></AdminLayout>;
}
