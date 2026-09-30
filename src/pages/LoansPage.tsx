import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/common/Badge';
import { PageTitle } from '../components/common/PageTitle';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { LoanModal } from '../components/loans/LoanModal';
import { useLibrary } from '../state/LibraryContext';
import { useToast } from '../state/ToastContext';

export function LoansPage() {
  const { books, users, loans, returnLoan, addLoan } = useLibrary();
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { showToast } = useToast();
  const availableBooks = books.filter(book => book.status === 'Disponible');
  const statusFor = (due: string) => due < new Date().toISOString().slice(0, 10) ? 'En retard' : 'En cours';
  async function createLoan(bookId: string, userId: string, start: string, due: string) {
    const error = await addLoan(bookId, userId, start, due);
    if (!error) showToast('L’emprunt a été enregistré.');
    return error;
  }
  async function handleReturn(id: string) {
    try {
      await returnLoan(id);
      showToast('Le livre a été retourné et est de nouveau disponible.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Une erreur est survenue', 'error');
    }
  }
  return <AdminLayout><PageTitle title="Emprunts et retours" subtitle="Suivez les livres actuellement empruntés." action={<Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>Nouvel emprunt</Button>} /><section className="content-card"><div className="tabs"><button className={!showHistory ? 'active' : ''} onClick={() => setShowHistory(false)}>Emprunts en cours</button><button className={showHistory ? 'active' : ''} onClick={() => setShowHistory(true)}>Historique des emprunts</button></div>{showHistory ? <p className="empty-state">Consultez l’historique complet depuis le menu Historique.</p> : <div className="table-wrap"><table className="table-loans"><thead><tr><th>Livre</th><th>Utilisateur</th><th>Date d'emprunt</th><th>Date d'échéance</th><th>Statut</th><th>Actions</th></tr></thead><tbody>{loans.map(loan => <tr key={loan.id ?? loan.title}><td>{loan.title}</td><td>{loan.user}</td><td>{loan.start}</td><td>{loan.due}</td><td><Badge tone={statusFor(loan.due) === 'En retard' ? 'red' : 'green'}>{statusFor(loan.due)}</Badge></td><td><span className="row-actions"><button type="button" aria-label={`Retourner ${loan.title}`} title="Retourner le livre" onClick={() => handleReturn(loan.id ?? '')}><Check size={14} /></button></span></td></tr>)}</tbody></table>{!loans.length && <p className="empty-state">Aucun emprunt en cours.</p>}</div>}</section><LoanModal open={showModal} books={availableBooks} users={users.filter(user => user.status === 'Actif')} onClose={() => setShowModal(false)} onSubmit={createLoan} /></AdminLayout>;
}
