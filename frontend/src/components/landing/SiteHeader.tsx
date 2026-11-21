import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Wordmark from './Wordmark';

// Header shared by the landing and /login: brand on the left, whatever the page needs on the right.
export default function SiteHeader({ children }: { children: ReactNode }) {
  return (
    <header className="fam-container fam-header">
      <Link to="/" className="fam-brand" aria-label="Ascension, inicio">
        <Wordmark />
      </Link>
      <div className="fam-header__end">{children}</div>
    </header>
  );
}
