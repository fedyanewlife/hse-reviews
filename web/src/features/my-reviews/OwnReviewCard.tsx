import { Star } from 'lucide-react';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { Icon } from '../../components/ui/Icon';
import type { Discipline, UserReview } from '../catalog/catalogTypes';
import { completionLabel, disciplineHref } from '../discipline/disciplineModel';
import { METRIC_CRITERIA } from '../discipline/disciplineTypes';
import { REVIEW_STATES, reviewDate } from './myReviewModel';
import styles from './MyReviewsPage.module.css';

export function ReviewStars({ value }: { value: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`Рекомендуешь на ${value} из 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Icon
          key={index}
          icon={Star}
          size={17}
          className={index < value ? styles.star : styles.mutedStar}
        />
      ))}
      <strong aria-hidden="true">{value}/5</strong>
    </span>
  );
}

export function OwnReviewCard({
  review,
  discipline,
  current = false,
}: {
  review: UserReview;
  discipline?: Discipline;
  current?: boolean;
}) {
  const date = reviewDate(review);
  return (
    <article
      className={styles.review}
      id={current ? 'my-current-review' : undefined}
      tabIndex={-1}
      aria-label="Твой отзыв"
    >
      <div className={styles.reviewHeading}>
        <div className={styles.course}>
          {discipline && (
            <div className={styles.courseMeta}>
              <DirectionMark direction={discipline.direction} size="s" />
              <span title={discipline.facultyLabel}>{discipline.faculty}</span>
            </div>
          )}
          <h2>
            {discipline ? (
              <a href={disciplineHref(discipline.id)}>{discipline.title}</a>
            ) : (
              'Название майнора недоступно'
            )}
          </h2>
        </div>
        <span className={styles.status} data-status={review.status}>
          {REVIEW_STATES[review.status].label}
        </span>
      </div>
      {(review.completionStatus || review.completionYear != null) && (
        <p className={styles.supporting}>
          {completionLabel({
            completionStatus: review.completionStatus ?? 'completed',
            completionYear: review.completionYear ?? null,
          })}
        </p>
      )}
      <div className={styles.recommendation}>
        <span>Порекомендовал бы майнор</span>
        <ReviewStars value={review.ratings.recommendation} />
      </div>
      <dl className={styles.metrics}>
        {METRIC_CRITERIA.map(({ key, label }) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              {review.ratings[key]} <span>/ 5</span>
            </dd>
          </div>
        ))}
      </dl>
      {review.experience.trim() && (
        <div className={styles.answer}>
          <h3>Твои впечатления</h3>
          <p>{review.experience}</p>
        </div>
      )}
      {review.advice.trim() && (
        <div className={styles.advice}>
          <h3>Что стоит знать перед выбором</h3>
          <p>{review.advice}</p>
        </div>
      )}
      {!review.experience.trim() && !review.advice.trim() && (
        <p className={styles.supporting}>Ты оставил оценки без комментария.</p>
      )}
      {(date || (review.status === 'published' && review.helpfulCount != null)) && (
        <div className={styles.reviewFooter}>
          {date && (
            <span>
              {date.label} <time dateTime={date.value}>{date.formatted}</time>
            </span>
          )}
          {review.status === 'published' && review.helpfulCount != null && (
            <span>
              Отметок «Полезно»: <strong>{review.helpfulCount}</strong>
            </span>
          )}
        </div>
      )}
    </article>
  );
}
