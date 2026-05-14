import { useState, useEffect, useRef } from 'react';

/**
 * Hook que garantiza un tiempo mínimo de display para evitar flicker visual
 * cuando los datos cargan muy rápido (ej. skeletons que titilan).
 *
 * @param isLoading - Estado de carga actual
 * @param minDelay - Tiempo mínimo en ms (default: 300)
 * @returns `true` mientras el loading deba mostrarse
 *
 * @example
 * ```tsx
 * const showSkeleton = useMinDelay(isLoading);
 * if (showSkeleton) return <SkeletonCard />;
 * ```
 */
export function useMinDelay(isLoading: boolean, minDelay = 300): boolean {
  const [show, setShow] = useState(isLoading);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTime.current = Date.now();
      setShow(true);
      return;
    }

    if (!isLoading && startTime.current !== null) {
      const elapsed = Date.now() - startTime.current;
      const remaining = minDelay - elapsed;

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShow(false);
        }, remaining);
        return () => clearTimeout(timer);
      }
    }

    setShow(isLoading);
  }, [isLoading, minDelay]);

  return show;
}
