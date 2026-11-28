import type { reviewSummary } from './disciplineModel';
import { METRIC_CRITERIA } from './disciplineTypes';
import styles from './DisciplinePage.module.css';

export function DisciplineRatings({
  averages,
}: {
  averages: ReturnType<typeof reviewSummary>['averages'];
}) {
  return (
    <section className={styles.panel} aria-labelledby="student-ratings">
      <h2 id="student-ratings">Оценки студентов</h2>
      <div className={styles.metrics}>
        {METRIC_CRITERIA.map(({ key, label }) => {
          const value = averages[key];
          return (
            <div className={styles.metric} key={key}>
              <strong>{label}</strong>
              <b className={styles.metricValue} aria-hidden={value !== null}>
                {value?.toLocaleString('ru-RU', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }) ?? '—'}
              </b>
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
