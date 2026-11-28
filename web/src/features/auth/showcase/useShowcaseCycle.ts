import { useEffect, useState } from 'react';
import { useMediaQuery } from '../../../lib/useMediaQuery';
import {
  advanceCycle,
  INITIAL_DELAY_MS,
  initialCycleState,
  RESUME_DELAY_MS,
  staticCycleState,
  type CycleState,
} from './showcaseCycle';

/** Запускает сценарий витрины на таймерах. */
export function useShowcaseCycle(queries: readonly string[], bubbleCounts: readonly number[]) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [state, setState] = useState<CycleState>(initialCycleState);

  useEffect(() => {
    if (reducedMotion) return;

    let current = initialCycleState;
    let timer: number | undefined;

    const schedule = (delayMs: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(tick, delayMs);
    };

    function tick() {
      const { next, delayMs } = advanceCycle(current, queries, bubbleCounts);
      current = next;
      setState(next);
      schedule(delayMs);
    }

    // В фоновой вкладке браузер сильно замедляет таймеры: останавливаемся
    // и продолжаем сразу при возвращении, а не после запоздавшего таймера.
    const onVisibilityChange = () => {
      if (document.hidden) window.clearTimeout(timer);
      else schedule(RESUME_DELAY_MS);
    };

    schedule(INITIAL_DELAY_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [reducedMotion, queries, bubbleCounts]);

  if (reducedMotion) {
    return { state: staticCycleState(queries[0] ?? '', bubbleCounts[0] ?? 0), reducedMotion };
  }
  return { state, reducedMotion };
}
