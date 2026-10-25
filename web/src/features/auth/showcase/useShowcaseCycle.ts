import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../../lib/useMediaQuery';
import {
  advanceCycle,
  INITIAL_DELAY_MS,
  initialCycleState,
  PAUSED_POLL_MS,
  RESUME_DELAY_MS,
  staticCycleState,
  type CycleState,
} from './showcaseCycle';

/** Кадр, на котором карточка и все отзывы уже показаны: только его можно задержать паузой. */
function isFullyShown(state: CycleState, bubbleCounts: readonly number[]) {
  return state.phase === 'show' && state.visibleBubbles >= (bubbleCounts[state.index] ?? 0);
}

/**
 * Крутит сценарий витрины на таймерах.
 * Пока `paused`, полностью показанная карточка не сменяется; печать, стирание
 * и появление отзывов паузой не прерываются, чтобы анимация не замирала на полпути.
 */
export function useShowcaseCycle(
  queries: readonly string[],
  bubbleCounts: readonly number[],
  paused: boolean,
) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [state, setState] = useState<CycleState>(initialCycleState);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (reducedMotion) return;

    let current = initialCycleState;
    let timer: number | undefined;

    const schedule = (delayMs: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(tick, delayMs);
    };

    function tick() {
      if (pausedRef.current && isFullyShown(current, bubbleCounts)) {
        schedule(PAUSED_POLL_MS);
        return;
      }
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
