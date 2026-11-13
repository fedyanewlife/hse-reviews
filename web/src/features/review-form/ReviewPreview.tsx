import { Star } from 'lucide-react';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { Icon } from '../../components/ui/Icon';
import { METRIC_CRITERIA } from '../discipline/disciplineTypes';
import type { Discipline } from '../catalog/catalogTypes';
import type { ReviewDraft } from './reviewFormModel';
import styles from './ReviewFormPage.module.css';

export function ReviewPreview({
  draft,
  item,
  completion,
}: {
  draft: ReviewDraft;
  item?: Discipline;
  completion?: string;
}) {
  return (
    <section className={styles.previewCard} aria-label="Предпросмотр отзыва">
      {item ? (
        <>
          <DirectionMark direction={item.direction} size="s" />
          <h3>{item.title}</h3>
        </>
      ) : (
        <h3>Твой майнор</h3>
      )}
      <div className={styles.previewMeta}>
        <span>{completion ?? 'Когда проходил'}</span>
        <span>
          <Icon icon={Star} size={15} className={styles.star} />
          {draft.ratings.recommendation ? `${draft.ratings.recommendation}/5` : 'Твоя рекомендация'}
        </span>
      </div>
      <dl className={styles.previewMetrics}>
        {METRIC_CRITERIA.map(({ key, label }) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{draft.ratings[key] ?? '—'}</dd>
          </div>
        ))}
      </dl>
      {draft.experience.trim() ? (
        <p className={styles.previewText}>{draft.experience.trim()}</p>
      ) : (
        <p className={styles.supporting}>Здесь появятся твои впечатления о майноре.</p>
      )}
      {draft.advice.trim() && (
        <div className={styles.previewAdvice}>
          <strong>Что стоит знать перед выбором</strong>
          <p>{draft.advice.trim()}</p>
        </div>
      )}
    </section>
  );
}
