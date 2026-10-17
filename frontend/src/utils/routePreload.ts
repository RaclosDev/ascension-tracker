/**
 * Utility for background preloading of lazy-loaded route chunks.
 * Eliminates suspense flickers and black frame drops on navigation.
 */

export const preloadRoute = (path: string): Promise<unknown> => {
  const loader = (() => {
    switch (path) {
      case '/settings':
        return import('../pages/SettingsPage');
      case '/utilities':
        return import('../pages/UtilitiesPage');
      case '/workout':
        return import('../pages/WorkoutPage');
      case '/nutrition':
        return import('../pages/NutritionPage');
      case '/tracking':
        return import('../pages/TrackingPage');
      case '/dashboard':
        return import('../pages/DashboardPage');
      default:
        return Promise.resolve();
    }
  })();

  return loader.catch(() => {});
};

export const preloadAllRoutes = (): void => {
  if (typeof window === 'undefined') return;

  const runPreload = () => {
    // Silently prefetch remaining non-critical chunks during browser idle time
    import('../pages/SettingsPage').catch(() => {});
    import('../pages/UtilitiesPage').catch(() => {});
    import('../pages/NutritionPage').catch(() => {});
    import('../pages/WorkoutPage').catch(() => {});
    import('../pages/TrackingPage').catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(
      runPreload,
    );
  } else {
    setTimeout(runPreload, 1000);
  }
};
