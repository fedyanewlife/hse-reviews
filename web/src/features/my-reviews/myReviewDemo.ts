import type { ReviewStatus, UserReview } from '../catalog/catalogTypes';

/** Explicit demo URL only; never stored or substituted for a failed API request. */
export function personalReviewPreview(value: string | null): UserReview | null {
  if (!['published', 'pending', 'rejected', 'local'].includes(value ?? '')) return null;
  const status = value as ReviewStatus;
  return {
    id: 'my-review-preview',
    disciplineId: 'ux-design',
    status,
    completionStatus: 'completed',
    completionYear: 2026,
    ratings: { difficulty: 3, workload: 4, interest: 5, usefulness: 5, recommendation: 5 },
    experience:
      'Много обратной связи по проекту. Видно свой прогресс: от первых набросков до готового прототипа. Особенно понравились разборы работ — после них понимаешь, что можно улучшить и почему.',
    advice:
      'Стоит заранее оставить время на проект. Задания проще делать понемногу каждую неделю, чем собирать всё перед просмотром.',
    createdAt: '2026-10-14T12:00:00Z',
    publishedAt: status === 'published' ? '2026-10-15T12:00:00Z' : null,
    helpfulCount: status === 'published' ? 27 : null,
    moderationNote:
      status === 'rejected'
        ? 'В отзыве указаны личные данные. Убери их из текста перед повторной отправкой.'
        : null,
  };
}
