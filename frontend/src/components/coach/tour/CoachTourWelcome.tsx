import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { readTourProgress, saveTourProgress } from './progress';

export default function CoachTourWelcome() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user?.email || pathname === '/entrenador/guia') return null;
  return <Welcome key={user.email} account={user.email} />;
}

function Welcome({ account }: { account: string }) {
  const [open, setOpen] = useState(() => !readTourProgress(account));
  const navigate = useNavigate();
  function dismiss() {
    saveTourProgress(account, { status: 'dismissed', step: 0 });
    setOpen(false);
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) dismiss();
      }}
    >
      <DialogContent>
        <DialogTitle>Conoce tu espacio de entrenador</DialogTitle>
        <DialogDescription>
          Prueba el recorrido completo con Lucía, una alumna ficticia: revisa su feedback, prepara
          una semana y comprueba cómo la recibe. Puedes ir paso a paso o reproducir la demo.
        </DialogDescription>
        <p className="text-sm text-muted-foreground">
          No necesitas tener alumnos. La demo no modifica tus datos.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            saveTourProgress(account, { status: 'started', step: 0 });
            setOpen(false);
            navigate('/entrenador/guia');
          }}
        >
          Empezar guía interactiva
        </button>
        <button className="btn btn-secondary" onClick={dismiss}>
          Ahora no
        </button>
        <p className="text-sm text-muted-foreground">
          Podrás abrirla de nuevo desde Inicio o Ajustes.
        </p>
      </DialogContent>
    </Dialog>
  );
}
