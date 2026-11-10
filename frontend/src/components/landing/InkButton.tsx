import React from 'react';

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

// The landing's call to action: a solid ink block. Always a real anchor.
export default function InkButton({ href, children, className = '', onClick }: Props) {
  return (
    <a href={href} className={`landing-cta ${className}`} onClick={onClick}>
      {children}
    </a>
  );
}
