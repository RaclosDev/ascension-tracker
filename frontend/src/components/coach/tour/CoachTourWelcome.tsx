import { useState } from 'react';
import { isCoachTourFrame } from './frame';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { readTourProgress, saveTourProgress } from './progress';

export default function CoachTourWelcome() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user?.email || isCoachTourFrame() || pathname.startsWith('/entrenador/guia')) return null;
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
          Recorre las pantallas con Lucía, una alumna de ejemplo. Iremos abriendo las pestañas y
          señalando dónde revisar su feedback, preparar la semana y comprobar cómo la recibe.
        </DialogDescription>
        <p className="text-sm text-muted-foreground">
          No necesitas tener alumnos. La demo no modifica tus datos.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            saveTourProgress(account, { status: 'started', step: 0 });
            setOpen(false);
            navigate('/entrenador/guia/recorrido');
          }}
        >
          Empezar guía interactiva
        </button>
        <button className="btn btn-secondary" onClick={dismiss}>
          Ahora no
        </button>
        <p className="text-sm text-muted-foreground">
          Podrás repetirlo o continuarlo desde la pestaña Tour.
        </p>
      </DialogContent>
    </Dialog>
  );
}
