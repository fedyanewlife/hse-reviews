import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { cx } from '../../lib/cx';
import { completionLabel } from './disciplineModel';
import { METRIC_CRITERIA, type PublishedReview } from './disciplineTypes';
import styles from './DisciplinePage.module.css';

const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' }).format(new Date(value));

type ReviewCardProps =
  | {
      preview?: false;
      review: PublishedReview;
      voted: boolean;
      votingEnabled: boolean;
      onVote: () => void;
    }
  | {
      preview: true;
      review: Pick<PublishedReview, 'experience' | 'advice'> & {
        ratings: Partial<PublishedReview['ratings']>;
      };
      completion?: string;
    };

export function DisciplineReviewCard(props: ReviewCardProps) {
  const { review } = props;
  const [expanded, setExpanded] = useState(false);
  const long = review.experience.length > 600;
  const completion = props.preview ? props.completion : completionLabel(props.review);
  const createdAt = props.preview ? null : props.review.createdAt;
  const recommendation = review.ratings.recommendation;
  const metrics = METRIC_CRITERIA.filter(({ key }) => review.ratings[key] !== undefined);
  const hasHeader = !!(completion || recommendation || createdAt);
  return (
    <article
      className={styles.reviewCard}
      id={props.preview ? undefined : `review-${props.review.id}`}
      tabIndex={props.preview ? undefined : -1}
      aria-label={props.preview ? undefined : `Отзыв: ${completion}`}
    >
      {hasHeader && (
        <div className={styles.reviewHeader}>
          {completion && <span className={styles.completion}>{completion}</span>}
          {recommendation !== undefined && (
            <span className={styles.recommendation}>
              <Icon icon={Star} size={15} className={styles.star} />
              {recommendation}/5 ·{' '}
              {recommendation >= 4
                ? 'рекомендует'
                : recommendation <= 2
                  ? 'не рекомендует'
                  : 'сомневается'}
            </span>
          )}
          {createdAt && <time dateTime={createdAt}>отзыв от {formatReviewDate(createdAt)}</time>}
        </div>
      )}
      {metrics.length > 0 && (
        <dl className={styles.reviewMetrics}>
          {metrics.map(({ key, label }) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{review.ratings[key]}</dd>
            </div>
          ))}
        </dl>
      )}
      {review.experience ? (
        <p className={cx(styles.reviewText, long && !expanded && styles.clampedText)}>
          {review.experience}
        </p>
      ) : (
        !review.advice && (
          <p className={styles.supporting}>
            {props.preview && !hasHeader && !metrics.length
              ? 'Здесь появится твой отзыв.'
              : 'Отзыв без комментария'}
          </p>
        )
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
      {!props.preview && (props.votingEnabled || props.review.helpfulCount !== null) && (
        <Button
          variant="secondary"
          size="s"
          className={cx(styles.helpful, props.voted && styles.helpfulSelected)}
          aria-pressed={props.voted}
          disabled={!props.votingEnabled}
          title={props.votingEnabled ? undefined : 'Голосование пока недоступно'}
          onClick={props.onVote}
        >
          <Icon icon={ThumbsUp} size={16} />
          Полезно
          {props.review.helpfulCount !== null && (
            <span>{props.review.helpfulCount + Number(props.voted)}</span>
          )}
        </Button>
      )}
    </article>
  );
}
