export const isCoachTourFrame = () => window.frameElement?.getAttribute('data-coach-tour') === 'v2';

export const tourRouteAllowed = (path: string) =>
  !path.includes('..') &&
  !path.includes('\\') &&
  (/^\/entrenador(?:\/(?:atletas|revisiones|planificacion|programas|recetas|pautas|ajustes|plan)(?:\/[\w-]+)*)?(?:\?[^#]*)?$/.test(
    path,
  ) ||
    path === '/utilities');
