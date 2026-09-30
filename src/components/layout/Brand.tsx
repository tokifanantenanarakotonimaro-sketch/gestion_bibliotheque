import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

type BrandProps = {
  light?: boolean;
};

export function Brand({ light = false }: BrandProps) {
  return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><BookOpen size={18} /></span><span>Bibliothèque</span></Link>;
}
