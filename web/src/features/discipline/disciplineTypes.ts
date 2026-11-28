import type { ReviewCriterion } from '../catalog/catalogTypes';

export type CompletionStatus = 'completed' | 'earlier' | 'studying' | 'unknown';
export type PublishedReview = {
  id: string;
  disciplineId: string;
  completionStatus: CompletionStatus;
  completionYear: number | null;
  ratings: Record<ReviewCriterion, number>;
  experience: string;
  advice: string;
  createdAt: string | null;
  helpfulCount: number | null;
};
export type ReviewSort = 'newest' | 'highest' | 'lowest';
export type DisciplineReviews = {
  items: readonly PublishedReview[];
};

export const METRIC_CRITERIA = [
  { key: 'difficulty', label: 'Сложность' },
  { key: 'workload', label: 'Нагрузка' },
  { key: 'interest', label: 'Интерес' },
  { key: 'usefulness', label: 'Польза' },
] as const;
