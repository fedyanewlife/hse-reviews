import { Icon } from '../../components/ui/Icon';
import { Star } from 'lucide-react';
import { reviewSummary } from './disciplineModel';
import { METRIC_CRITERIA } from './disciplineTypes';
import type { PublishedReview } from './disciplineTypes';
import styles from './DisciplinePage.module.css';

export function DisciplineRatings({ reviews }: { reviews: readonly PublishedReview[] }) {
  const summary = reviewSummary(reviews);
  return (
    <section className={styles.panel} aria-labelledby="student-ratings">
      <div className={styles.sectionHeading}>
        <h2 id="student-ratings">Оценки студентов</h2>
        <span>Из 5</span>
      </div>
      <p className={styles.supporting}>
        Сложность и нагрузка — не хорошие или плохие оценки. Кому-то нужен вызов, а кому-то — лёгкий
        курс.
      </p>
      <div className={styles.ratingsLayout}>
        <div className={styles.metrics}>
          {METRIC_CRITERIA.map(({ key, label, description }) => {
            const value = summary.averages[key];
            return (
              <div className={styles.metric} key={key}>
                <div>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </div>
                <div
                  className={styles.meter}
                  role={value === null ? undefined : 'meter'}
                  aria-label={value === null ? `${label}: нет оценок` : label}
                  aria-valuemin={value === null ? undefined : 1}
                  aria-valuemax={value === null ? undefined : 5}
                  aria-valuenow={value ?? undefined}
                  data-accent={key === 'interest' || key === 'usefulness'}
                >
                  {[0, 1, 2, 3, 4].map((segment) => (
                    <span key={segment} aria-hidden="true">
                      <i
                        style={{
                          width: `${Math.max(0, Math.min(1, (value ?? 0) - segment)) * 100}%`,
                        }}
                      />
                    </span>
                  ))}
                </div>
                <b className={styles.metricValue}>
                  {value === null
                    ? '—'
                    : value.toLocaleString('ru-RU', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                </b>
              </div>
            );
          })}
        </div>
        <div className={styles.distribution}>
          <h3>Порекомендовали бы</h3>
          <p className={styles.supporting}>Сколько человек поставили каждую оценку</p>
          <ol>
            {summary.distribution.map(({ rating, count }) => (
              <li key={rating} aria-label={`${rating} из 5: ${count}`}>
                <span>
                  {rating} <Icon icon={Star} size={12} className={styles.star} />
                </span>
                <span className={styles.histogramTrack} aria-hidden="true">
                  <i style={{ width: `${summary.count ? (count / summary.count) * 100 : 0}%` }} />
                </span>
                <strong>{count}</strong>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
