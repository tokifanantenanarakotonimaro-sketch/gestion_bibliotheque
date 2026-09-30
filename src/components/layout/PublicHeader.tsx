import { Link } from 'react-router-dom';
import { Brand } from './Brand';

type PublicHeaderProps = {
  auth?: boolean;
};

export function PublicHeader({ auth = false }: PublicHeaderProps) {
  return <header className="public-header"><Brand light={auth} />{!auth && <nav><Link to="/">Accueil</Link><Link to="/login">Se connecter</Link><Link className="header-cta" to="/register">S'inscrire</Link></nav>}</header>;
}
