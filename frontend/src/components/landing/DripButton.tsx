import React from 'react';
import { ArrowRight } from 'lucide-react';

const Drip = () => (
  <svg className="drip" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
    <path
      fill="currentColor"
      d="M0 0h100v2.5c-3 0-4 1-4 3.5s-1 4-2.5 4-2-2-2-4-1-3.5-4-3.5c-5 0-6 0-9 0-2 0-3 1-3 5s-1 6-2.5 6-2.5-2-2.5-6-1-5-3-5c-8 0-12 0-20 0-2 0-3 1-3 3.5s-1 3.5-2.5 3.5-2.5-1-2.5-3.5-1-3.5-3-3.5c-6 0-8 0-14 0-2 0-3 1.5-3 4s-1 4-2.5 4S18 10.5 18 8s-1-4-3-4H0z"
    />
  </svg>
);

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

// The template's CTA: a white block with a blue paint drip. Always a real anchor.
export default function DripButton({ href, children, className = '' }: Props) {
  return (
    <a href={href} className={`landing-drip ${className}`}>
      <span>{children}</span>
      <ArrowRight size={18} aria-hidden="true" />
      <Drip />
    </a>
  );
}
