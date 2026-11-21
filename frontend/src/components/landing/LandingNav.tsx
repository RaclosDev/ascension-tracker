import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';

const links = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#pruebalo', label: 'Pruébalo' },
  { href: '#entrenadores', label: 'Entrenadores' },
  { href: '/demo', label: 'Demo' },
];

export default function LandingNav() {
  return (
    <SiteHeader>
      <nav aria-label="Secciones" className="fam-nav">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="fam-navlink">
            {l.label}
          </a>
        ))}
      </nav>
      <Link to="/login" className="fam-btn fam-btn--ink">
        Entrar
      </Link>
    </SiteHeader>
  );
}
