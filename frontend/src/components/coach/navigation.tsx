import {
  Home,
  Users,
  MessageSquareText,
  ClipboardList,
  Settings,
  CreditCard,
  Wrench,
  Compass,
} from 'lucide-react';

export const coachNavItems = [
  {
    path: '/entrenador',
    icon: <Home className="w-5 h-5" />,
    label: 'Inicio',
    shortLabel: 'Inicio',
  },
  {
    path: '/entrenador/alumnos',
    icon: <Users className="w-5 h-5" />,
    label: 'Alumnos',
    shortLabel: 'Alumnos',
  },
  {
    path: '/entrenador/revisiones',
    icon: <MessageSquareText className="w-5 h-5" />,
    label: 'Revisiones',
    shortLabel: 'Revisiones',
  },
  {
    path: '/entrenador/planificacion',
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Biblioteca',
    shortLabel: 'Biblioteca',
  },
  {
    path: '/entrenador/ajustes',
    icon: <Settings className="w-5 h-5" />,
    label: 'Ajustes',
    shortLabel: 'Ajustes',
  },
  {
    path: '/entrenador/plan',
    icon: <CreditCard className="w-5 h-5" />,
    label: 'Suscripción',
    shortLabel: 'Suscripción',
  },
  {
    path: '/utilities',
    icon: <Wrench className="w-5 h-5" />,
    label: 'Utilidades',
    shortLabel: 'Utilidades',
  },
  {
    path: '/entrenador/guia',
    icon: <Compass className="w-5 h-5" />,
    label: 'Tour',
    shortLabel: 'Tour',
  },
];

export const coachBottomPaths = ['/entrenador', '/entrenador/alumnos', '/entrenador/revisiones'];

export function isItemActive(itemPath: string, pathname: string) {
  if (itemPath === '/entrenador') return pathname === '/entrenador';
  if (itemPath === '/entrenador/planificacion')
    return [
      '/entrenador/planificacion',
      '/entrenador/programas',
      '/entrenador/recetas',
      '/entrenador/pautas',
    ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (itemPath === '/entrenador/ajustes' && pathname === '/settings') return true;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
