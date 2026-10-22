/**
 * Сценарий анимации витрины: в поиск «печатается» запрос, появляется карточка майнора,
 * по одному всплывают отзывы, затем запрос стирается и цикл переходит к следующей карточке.
 */

export type Phase = 'typing' | 'searching' | 'show' | 'erasing' | 'hiding';

export type CycleState = {
  index: number;
  phase: Phase;
  typedLength: number;
  visibleBubbles: number;
};

export const INITIAL_DELAY_MS = 700;
export const PAUSED_POLL_MS = 200;
export const RESUME_DELAY_MS = 300;

export const initialCycleState: CycleState = {
  index: 0,
  phase: 'typing',
  typedLength: 0,
  visibleBubbles: 0,
};

/** Статичный кадр для prefers-reduced-motion: первая карточка со всеми отзывами. */
export function staticCycleState(firstQuery: string, bubbleCount: number): CycleState {
  return { index: 0, phase: 'show', typedLength: firstQuery.length, visibleBubbles: bubbleCount };
}

/** Следующий шаг сценария и задержка перед ним. */
export function advanceCycle(
  state: CycleState,
  queries: readonly string[],
  bubbleCount: number,
): { next: CycleState; delayMs: number } {
  const query = queries[state.index] ?? '';

  switch (state.phase) {
    case 'typing':
      if (state.typedLength < query.length) {
        return {
          next: { ...state, typedLength: state.typedLength + 1 },
          delayMs: 85 + Math.random() * 70,
        };
      }
      return { next: { ...state, phase: 'searching' }, delayMs: 450 };

    case 'searching':
      return { next: { ...state, phase: 'show', visibleBubbles: 0 }, delayMs: 900 };

    case 'show':
      if (state.visibleBubbles < bubbleCount) {
        const visibleBubbles = state.visibleBubbles + 1;
        return {
          next: { ...state, visibleBubbles },
          delayMs: visibleBubbles < bubbleCount ? 1400 : 4200,
        };
      }
      return { next: { ...state, phase: 'erasing', visibleBubbles: 0 }, delayMs: 400 };

    case 'erasing':
      if (state.typedLength > 0) {
        return { next: { ...state, typedLength: state.typedLength - 1 }, delayMs: 35 };
      }
      return { next: { ...state, phase: 'hiding' }, delayMs: 750 };

    case 'hiding':
      return {
        next: { ...state, phase: 'typing', index: (state.index + 1) % queries.length },
        delayMs: 300,
      };
  }
}
