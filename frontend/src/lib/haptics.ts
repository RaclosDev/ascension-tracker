/** Vibration feedback on supported mobile devices; a no-op on desktop and unsupported browsers. */

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
  /** Ultra-subtle click feedback (weight steppers, number scrollers) */
  step: () => vibrate(8),

  /** Light click feedback (bottom nav tabs, segmented controls, chips) */
  light: () => vibrate(12),

  /** Medium feedback (card expand, bottom sheet open, action menu) */
  medium: () => vibrate(22),

  /** Satisfying confirmation (set marked as completed, barcode detected) */
  success: () => vibrate([18, 40, 24]),

  /** Rest timer expired or alert countdown */
  alarm: () => vibrate([100, 60, 120, 60, 150]),

  /** Personal record (PR) or workout completion fanfare */
  celebration: () => vibrate([35, 40, 50, 40, 80]),

  /** Warning or destructive threshold reached (swipe to delete) */
  warning: () => vibrate([35, 40, 35]),

  /** Error or invalid input (negative weight, failed validation) */
  error: () => vibrate([50, 30, 50]),
};
