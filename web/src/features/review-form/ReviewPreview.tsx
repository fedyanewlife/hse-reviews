import { DisciplineReviewCard } from '../discipline/DisciplineReviewCard';
import type { ReviewDraft } from './reviewFormModel';
import styles from './ReviewFormPage.module.css';

export function ReviewPreview({
  draft: { ratings, experience, advice },
  completion,
}: {
  draft: ReviewDraft;
  completion?: string;
}) {
  return (
    <section className={styles.preview} aria-labelledby="review-preview-heading">
      <h2 id="review-preview-heading">Предпросмотр отзыва</h2>
      <DisciplineReviewCard
        preview
        completion={completion}
        review={{ ratings, experience: experience.trim(), advice: advice.trim() }}
      />
    </section>
  );
}
