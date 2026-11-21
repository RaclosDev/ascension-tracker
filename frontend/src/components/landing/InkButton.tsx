import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  to: string;
  children: ReactNode;
  className?: string;
};

// The landing's call to action: a solid ink block that leads to another page of the site.
export default function InkButton({ to, children, className = '' }: Props) {
  return (
    <Link to={to} className={`landing-cta ${className}`}>
      {children}
    </Link>
  );
}
