import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';

export function HomePage() {
  return (
    <main className="hero-page">
      <PublicHeader />
      <div className="hero-copy">
        <p className="eyebrow">LIRE. APPRENDRE. S'ÉVADER.</p>
        <h1>
          Bienvenue dans votre
          <br />
          <em>bibliothèque</em>
        </h1>
        <p className="hero-text">
          Empruntez, découvrez, lisez.
          <br />
          Une bibliothèque à portée de main.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="button button-primary">
            Se connecter
          </Link>
          <Link to="/register" className="button button-outline-light">
            S'inscrire
          </Link>
        </div>
      </div>
      <div className="hero-books">
        <div className="hero-plant">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>
        <div className="book-stack">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>
        <div className="coffee"></div>
      </div>
      <div className="hero-shape shape-a"></div>
      <div className="hero-shape shape-b"></div>
    </main>
  );
}
