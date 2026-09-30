import { Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/common/Badge';
import { PageTitle } from '../components/common/PageTitle';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useLibrary } from '../state/LibraryContext';

export function HistoryPage() {
  const { history } = useLibrary();
  const [search, setSearch] = useState('');
  const result = history.filter(item => `${item.title} ${item.author} ${item.user ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <AdminLayout><PageTitle title="Historique des emprunts" subtitle="Retrouvez toutes les transactions passées." /><section className="content-card"><label className="inline-search history-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un livre, un auteur ou un utilisateur..." aria-label="Rechercher dans l’historique" /></label><div className="table-wrap"><table className="table-history"><thead><tr><th>Titre</th><th>Auteur</th><th>Date d'emprunt</th><th>Date de retour</th><th>Statut</th></tr></thead><tbody>{result.map(item => <tr key={item.id ?? `${item.title}-${item.end}`}><td>{item.title}</td><td>{item.author}</td><td>{item.start}</td><td>{item.end}</td><td><Badge>{item.status}</Badge></td></tr>)}</tbody></table>{!result.length && <p className="empty-state">Aucun résultat.</p>}</div></section></AdminLayout>;
}
