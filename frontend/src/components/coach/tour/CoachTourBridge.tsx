import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tourRouteAllowed } from './frame';

export default function CoachTourBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      const data = event.data;
      if (
        !data ||
        typeof data !== 'object' ||
        !('type' in data) ||
        data.type !== 'coach-tour:navigate' ||
        !('path' in data) ||
        typeof data.path !== 'string' ||
        !tourRouteAllowed(data.path)
      )
        return;
      navigate(data.path);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [navigate]);
  useEffect(() => {
    window.parent.postMessage(
      { type: 'coach-tour:route', path: location.pathname + location.search },
      window.location.origin,
    );
  }, [location]);
  return null;
}
