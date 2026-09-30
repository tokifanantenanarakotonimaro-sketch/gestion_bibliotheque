import { Plus, Users, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Badge } from '../components/common/Badge';
import { PageTitle } from '../components/common/PageTitle';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { useLibrary } from '../state/LibraryContext';
import { useToast } from '../state/ToastContext';

export function UsersPage() {
  const { users, addUser } = useLibrary();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes('@') || password.length < 6) { setError('Saisissez un nom, une adresse e-mail valide et un mot de passe de 6 caractères minimum.'); return; }
    setBusy(true);
    try {
      const result = await addUser(name, email, password);
      if (result) { setError(result); return; }
      setName(''); setEmail(''); setPassword(''); setError(''); setOpen(false);
      showToast('Le nouvel utilisateur a été ajouté.');
    } finally {
      setBusy(false);
    }
  }
  return <AdminLayout><PageTitle title="Utilisateurs" subtitle="Gérez les comptes et les accès de votre bibliothèque." action={<Button icon={<Plus size={15} />} onClick={() => setOpen(true)}>Ajouter un utilisateur</Button>} /><section className="content-card"><div className="table-wrap"><table className="table-users"><thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><span className="avatar avatar-small"><Users size={13} /></span>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td><Badge>{user.status}</Badge></td></tr>)}</tbody></table></div></section>{open && <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}><div className="book-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="modal-heading"><div><h2>Ajouter un utilisateur</h2><p>Créez un compte lecteur.</p></div><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer"><X size={18} /></button></div><form className="book-form" onSubmit={submit}>{error && <p className="form-error">{error}</p>}<label>Nom complet<input value={name} onChange={event => setName(event.target.value)} required /></label><label>Adresse e-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Mot de passe<input type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={6} placeholder="6 caractères minimum" required /></label><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setOpen(false)}>Annuler</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Création…' : 'Créer le compte'}</button></div></form></div></div>}</AdminLayout>;
}
