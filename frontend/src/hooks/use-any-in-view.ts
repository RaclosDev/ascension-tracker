import { RefObject, useEffect, useState } from 'react';

/**
 * True while at least one element matching `selector` inside the container is on screen.
 * The matches are read again whenever `key` changes, so pass whatever adds or removes them.
 * Without IntersectionObserver it reports false.
 */
export function useAnyInView(
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  key: string,
): boolean {
  const [anyInView, setAnyInView] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    const targets = container ? Array.from(container.querySelectorAll(selector)) : [];
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') {
      setAnyInView(false);
      return;
    }

    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setAnyInView(visible.size > 0);
    });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [containerRef, selector, key]);

  return anyInView;
}
