import { BookOpen, BookOpenCheck, Clock3, Home, LogOut, Search, Settings, Users, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../common/Button';
import { Brand } from './Brand';
import { useLibrary } from '../../state/LibraryContext';

type SidebarProps = {
  open: boolean;
  close: () => void;
};

const navigation: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/admin', label: 'Accueil', icon: Home },
  { to: '/admin/books', label: 'Livres', icon: BookOpen },
  { to: '/admin/loans', label: 'Emprunts / Retours', icon: BookOpenCheck },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/history', label: 'Historique', icon: Clock3 },
  { to: '/admin/search', label: 'Recherche', icon: Search },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar({ open, close }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useLibrary();
  function handleLogout() { logout(); close(); navigate('/login'); }
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><div className="sidebar-top"><Brand light /><button className="close-sidebar" onClick={close}><X size={18} /></button></div><nav className="sidebar-nav">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin'} onClick={close}><Icon size={15} />{label}</NavLink>)}</nav><div className="sidebar-bottom"><div className="sidebar-books"><div className="sidebar-illustration"><span></span><i></i><i></i><i></i></div><p>Lisez, c'est explorer<br />sans jamais quitter<br />sa pièce...</p></div><Button variant="ghost" icon={<LogOut size={15} />} onClick={handleLogout}>Se déconnecter</Button></div></aside>;
}
