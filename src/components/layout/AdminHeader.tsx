import { ChevronRight, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

type AdminHeaderProps = {
  onMenu: () => void;
};

export function AdminHeader({ onMenu }: AdminHeaderProps) {
  const location = useLocation();
  const [query, setQuery] = useState('');

  return <header className="admin-header"><button className="menu-button" onClick={onMenu}><Menu size={20} /></button><div className="top-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={location.pathname.includes('search') ? 'Rechercher...' : 'Rechercher un livre, un auteur...'} /></div><div className="admin-user"><span className="avatar avatar-small">A</span><span>Admin</span><ChevronRight size={14} /></div></header>;
}
