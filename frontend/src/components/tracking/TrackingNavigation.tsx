import { NavLink } from 'react-router-dom';

const sections = [
  { path: '/tracking', label: 'Semanal' },
  { path: '/tracking/pasos', label: 'Pasos' },
  { path: '/tracking/peso', label: 'Peso' },
];

export function TrackingNavigation() {
  return (
    <nav aria-label="Seguimiento" className="segmented mb-6">
      {sections.map(({ path, label }) => (
        <NavLink key={path} to={path} end className="segmented-option">
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
