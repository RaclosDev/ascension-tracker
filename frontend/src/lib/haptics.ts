/**
 * Web Haptics Utility for PWA
 * Provides tactile physical feedback on supported mobile devices.
 * Gracefully no-ops on desktop or unsupported browsers.
 */

function vibrate(pattern: number | number[]): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

export const haptics = {
  /** Light click feedback (UI buttons, tabs, segmented control) */
  light: () => vibrate(15),

  /** Medium feedback (card expand, modal open) */
  medium: () => vibrate(25),

  /** Satisfying confirmation (set marked as completed) */
  success: () => vibrate(40),

  /** Rest timer expired or alert countdown */
  alarm: () => vibrate([100, 60, 120, 60, 150]),

  /** Personal record (PR) or workout completion fanfare */
  celebration: () => vibrate([40, 30, 60, 40, 100]),

  /** Warning or destructive action (delete set/exercise) */
  warning: () => vibrate([35, 40, 35]),
};
