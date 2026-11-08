import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { Icon } from '../../components/ui/Icon';
import { useMediaQuery } from '../../lib/useMediaQuery';
import {
  advanceHeroReviewCycle,
  initialHeroReviewCycle,
  type HeroReviewPhase,
} from './heroReviewCycle';
import styles from './CatalogPage.module.css';

export type HeroReview = {
  id: string;
  discipline: string;
  rating: number;
  text: string;
};

export function HeroReviews({
  reviews,
  paused,
}: {
  reviews: readonly HeroReview[];
  paused: boolean;
}) {
  const staticReviews = useMediaQuery('(max-width: 768px), (prefers-reduced-motion: reduce)');
  const cycle = useRef(initialHeroReviewCycle(reviews.length));
  const [slots, setSlots] = useState(cycle.current.slots);

  useEffect(() => {
    if (staticReviews || paused || reviews.length <= 2) return;
    let timer: number;
    let started = performance.now();

    function debitTime() {
      const now = performance.now();
      // A throttled background tab must not make both bubbles leave at once.
      const elapsed = Math.min(
        now - started,
        Math.min(...cycle.current.slots.map((slot) => slot.remaining)),
      );
      cycle.current.slots = cycle.current.slots.map((slot) => ({
        ...slot,
        remaining: Math.max(0, slot.remaining - elapsed),
      }));
      started = now;
    }
    function schedule() {
      timer = window.setTimeout(
        () => {
          debitTime();
          cycle.current = advanceHeroReviewCycle(cycle.current, reviews.length);
          setSlots(cycle.current.slots);
          schedule();
        },
        Math.min(...cycle.current.slots.map((slot) => slot.remaining)),
      );
    }
    schedule();
    return () => {
      window.clearTimeout(timer);
      debitTime();
    };
  }, [paused, staticReviews, reviews.length]);

  const visible = staticReviews ? initialHeroReviewCycle(reviews.length).slots : slots;
  return (
    <div className={styles.heroIllustration} aria-label="Отзывы о дисциплинах">
      {visible.map((slot, index) => {
        const review = reviews[slot.index];
        if (!review) return null;
        const phase: HeroReviewPhase = staticReviews ? 'still' : slot.phase;
        return (
          <div className={styles.heroQuotePosition} key={index}>
            <button
              type="button"
              className={styles.heroQuote}
              data-phase={phase}
              data-review-id={review.id}
              style={{ animationPlayState: paused ? 'paused' : 'running' }}
            >
              <span className={styles.heroStars}>
                <span className={styles.heroStarIcons} aria-hidden="true">
                  {Array.from({ length: 5 }, (_, star) => (
                    <Icon
                      key={star}
                      icon={Star}
                      size={12}
                      className={star < review.rating ? styles.star : styles.mutedStar}
                    />
                  ))}
                </span>
                <span aria-label={`Оценка автора: ${review.rating} из 5`}>{review.rating}</span>
              </span>
              <span className={styles.heroQuoteText}>{review.text}</span>
              <small>{review.discipline}</small>
            </button>
          </div>
        );
      })}
    </div>
  );
}
