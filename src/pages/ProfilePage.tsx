import { Eye } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Field } from '../components/common/Field';
import { PageTitle } from '../components/common/PageTitle';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useEffect, useState } from 'react';
import { useLibrary } from '../state/LibraryContext';
import { useToast } from '../state/ToastContext';

export function ProfilePage() {
  const { profile, updateProfile, changePassword } = useLibrary();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');

  // Le profil est chargé depuis l'API en asynchrone : on synchronise les champs
  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
  }, [profile.name, profile.email]);

  async function saveProfile() {
    if (!name.trim() || !email.includes('@')) { setMessage('Nom et adresse e-mail valides obligatoires.'); return; }
    const error = await updateProfile({ name: name.trim(), email: email.trim() });
    if (error) { setMessage(error); return; }
    setEditing(false);
    setMessage('Informations mises à jour.');
    showToast('Les informations du profil ont été mises à jour.');
  }

  async function savePassword() {
    if (!currentPassword) { setMessage('Saisissez votre mot de passe actuel.'); return; }
    if (password.length < 6 || password !== confirmation) { setMessage('Les mots de passe doivent être identiques et contenir 6 caractères.'); return; }
    const error = await changePassword(currentPassword, password);
    if (error) { setMessage(error); return; }
    setCurrentPassword('');
    setPassword('');
    setConfirmation('');
    setMessage('Mot de passe mis à jour.');
    showToast('Le mot de passe a été mis à jour.');
  }
  return <AdminLayout><PageTitle title="Mon profil" subtitle="Gérez vos informations personnelles et vos préférences." /><div className="settings-grid"><section className="content-card profile-card"><div className="profile-heading"><span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span><div><h2>{profile.name}</h2><p>{profile.email}</p></div></div><Button variant="outline" onClick={() => setEditing(!editing)}>Modifier mes informations</Button>{editing && <div className="profile-edit"><Field placeholder="Nom complet" value={name} onChange={setName} icon={<span>⌕</span>} /><Field placeholder="Adresse e-mail" type="email" value={email} onChange={setEmail} icon={<span>@</span>} /><Button onClick={saveProfile}>Enregistrer</Button></div>}</section><section className="content-card info-card"><h2>Informations personnelles</h2><div className="info-list"><span><b>Nom</b>{profile.name}</span><span><b>Email</b>{profile.email}</span><span><b>Rôle</b>Administrateur</span></div></section><section className="content-card password-card"><h2>Changer le mot de passe</h2><div className="password-grid"><Field placeholder="Mot de passe actuel" type="password" icon={<span>⌕</span>} value={currentPassword} onChange={setCurrentPassword} trailing={<Eye size={15} />} /><Field placeholder="Nouveau mot de passe" type="password" icon={<span>⌕</span>} value={password} onChange={setPassword} trailing={<Eye size={15} />} /><Field placeholder="Confirmer le mot de passe" type="password" icon={<span>⌕</span>} value={confirmation} onChange={setConfirmation} trailing={<Eye size={15} />} /></div><Button onClick={savePassword}>Mettre à jour</Button>{message && <p className="form-message">{message}</p>}</section></div></AdminLayout>;
}
