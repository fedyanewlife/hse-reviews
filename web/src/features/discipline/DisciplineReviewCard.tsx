import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { cx } from '../../lib/cx';
import { completionLabel } from './disciplineModel';
import { METRIC_CRITERIA, type PublishedReview } from './disciplineTypes';
import styles from './DisciplinePage.module.css';

export const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' }).format(new Date(value));

export function DisciplineReviewCard({
  review,
  voted,
  votingEnabled,
  onVote,
}: {
  review: PublishedReview;
  voted: boolean;
  votingEnabled: boolean;
  onVote: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = review.experience.length > 600;
  const recommendation = review.ratings.recommendation;
  return (
    <article
      className={styles.reviewCard}
      id={`review-${review.id}`}
      tabIndex={-1}
      aria-label={`Отзыв: ${completionLabel(review)}`}
    >
      <div className={styles.reviewHeader}>
        <span className={styles.completion}>{completionLabel(review)}</span>
        <span className={styles.recommendation}>
          <Icon icon={Star} size={15} className={styles.star} />
          {recommendation}/5 ·{' '}
          {recommendation >= 4
            ? 'рекомендует'
            : recommendation <= 2
              ? 'не рекомендует'
              : 'сомневается'}
        </span>
        {review.createdAt && (
          <time dateTime={review.createdAt}>отзыв от {formatReviewDate(review.createdAt)}</time>
        )}
      </div>
      <dl className={styles.reviewMetrics}>
        {METRIC_CRITERIA.map(({ key, label }) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{review.ratings[key]}</dd>
          </div>
        ))}
      </dl>
      {review.experience ? (
        <p className={cx(styles.reviewText, long && !expanded && styles.clampedText)}>
          {review.experience}
        </p>
      ) : (
        !review.advice && <p className={styles.supporting}>Отзыв без комментария</p>
      )}
      {long && (
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? 'Свернуть' : 'Читать полностью'}
        </button>
      )}
      {review.advice && (
        <div className={styles.reviewAdvice}>
          <strong>Что стоит знать перед выбором</strong>
          <p>{review.advice}</p>
        </div>
      )}
      {(votingEnabled || review.helpfulCount !== null) && (
        <Button
          variant="secondary"
          size="s"
          className={cx(styles.helpful, voted && styles.helpfulSelected)}
          aria-pressed={voted}
          disabled={!votingEnabled}
          title={votingEnabled ? undefined : 'Голосование пока недоступно'}
          onClick={onVote}
        >
          <Icon icon={ThumbsUp} size={16} />
          Полезно
          {review.helpfulCount !== null && <span>{review.helpfulCount + Number(voted)}</span>}
        </Button>
      )}
    </article>
  );
}
