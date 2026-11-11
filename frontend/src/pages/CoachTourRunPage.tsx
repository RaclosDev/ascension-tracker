import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CoachTourOverlay from '../components/coach/tour/CoachTourOverlay';
import { COACH_TOUR_STEPS } from '../components/coach/tour/steps';
import { readTourProgress, saveTourProgress } from '../components/coach/tour/progress';
import { useTourTarget } from '../components/coach/tour/useTourTarget';
import '../styles/coach-tour.css';

export default function CoachTourRunPage() {
  const { user } = useAuth();
  return user?.email ? <Run key={user.email} account={user.email} /> : null;
}

function Run({ account }: { account: string }) {
  const navigate = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const [index, setIndex] = useState(() =>
    Math.min(readTourProgress(account)?.step ?? 0, COACH_TOUR_STEPS.length - 1),
  );
  const [epoch, setEpoch] = useState(0);
  const { rect, error } = useTourTarget(frame, COACH_TOUR_STEPS[index], epoch);
  useEffect(() => {
    saveTourProgress(account, { status: 'started', step: index });
  }, [account, index]);
  return (
    <div className="coach-tour-run">
      <iframe
        ref={frame}
        data-coach-tour="v2"
        src="/entrenador"
        title="Pantallas del entrenador durante el tour"
        aria-hidden="true"
        inert
        tabIndex={-1}
        onLoad={() => setEpoch((value) => value + 1)}
      />
      <CoachTourOverlay
        index={index}
        rect={rect}
        error={error}
        go={setIndex}
        close={(completed) => {
          saveTourProgress(account, {
            status: completed ? 'completed' : 'started',
            step: completed ? 0 : index,
          });
          navigate('/entrenador/guia');
        }}
        retry={() => {
          if (frame.current) frame.current.src = '/entrenador';
          setEpoch((value) => value + 1);
        }}
      />
    </div>
  );
}
