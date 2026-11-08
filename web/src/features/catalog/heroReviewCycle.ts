export const HERO_REVIEW_CYCLE_MS = 5500;
export const HERO_REVIEW_EXIT_MS = 200;
export const HERO_REVIEW_ENTER_MS = 320;

export type HeroReviewPhase = 'still' | 'leaving' | 'entering';
export type HeroReviewSlot = { index: number; phase: HeroReviewPhase; remaining: number };
export type HeroReviewCycle = { slots: HeroReviewSlot[]; next: number };

export function initialHeroReviewCycle(count: number): HeroReviewCycle {
  return {
    slots: Array.from({ length: Math.min(2, count) }, (_, index) => ({
      index,
      phase: 'still',
      remaining: HERO_REVIEW_CYCLE_MS + (index * HERO_REVIEW_CYCLE_MS) / 2,
    })),
    next: Math.min(2, count),
  };
}

/** One deadline at a time: a delayed browser timer never skips unseen reviews. */
export function advanceHeroReviewCycle(cycle: HeroReviewCycle, count: number): HeroReviewCycle {
  if (count <= 2) return cycle;
  let next = cycle.next;
  const slots = cycle.slots.map((slot) => {
    if (slot.remaining > 0) return slot;
    if (slot.phase === 'still') {
      return { ...slot, phase: 'leaving' as const, remaining: HERO_REVIEW_EXIT_MS };
    }
    if (slot.phase === 'leaving') {
      // Avoid both the outgoing review and the review visible in the other bubble.
      const occupied = cycle.slots.map((value) => value.index);
      let index = next % count;
      while (occupied.includes(index)) index = (index + 1) % count;
      next = (index + 1) % count;
      return { index, phase: 'entering' as const, remaining: HERO_REVIEW_ENTER_MS };
    }
    return {
      ...slot,
      phase: 'still' as const,
      remaining: HERO_REVIEW_CYCLE_MS - HERO_REVIEW_EXIT_MS - HERO_REVIEW_ENTER_MS,
    };
  });
  return { slots, next };
}
