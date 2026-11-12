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
export type ReviewAudience = 'all' | 'completed' | 'studying';
export type ReviewSort = 'newest' | 'helpful' | 'highest' | 'lowest';

export const METRIC_CRITERIA = [
  { key: 'difficulty', label: 'Сложность', description: 'Насколько трудно' },
  { key: 'workload', label: 'Нагрузка', description: 'Сколько времени уходит' },
  { key: 'interest', label: 'Интерес', description: 'Насколько увлекает' },
  { key: 'usefulness', label: 'Польза', description: 'Для учёбы и работы' },
] as const;
