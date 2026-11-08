import { DIRECTIONS, type Direction } from '../../components/ui/directions';

export type CatalogDirection = Direction;

export type Discipline = {
  id: string;
  title: string;
  direction: CatalogDirection;
  faculty: string;
  facultyLabel?: string;
  rating: number | null;
  reviewCount: number;
  reviews: readonly { rating: number; text: string }[];
};

export const CATALOG_DIRECTIONS = (Object.keys(DIRECTIONS) as CatalogDirection[]).map((id) => ({
  id,
  label: DIRECTIONS[id].label,
}));

export type CatalogView = 'disciplines' | 'favorites' | 'reviews';
export type CatalogSort = 'reviews' | 'rating' | 'title';
export type CatalogFilters = {
  query: string;
  direction: CatalogDirection | 'all';
  faculties: string[];
  minimumRating: number;
  sort: CatalogSort;
};

export const REVIEW_CRITERIA = [
  { key: 'difficulty', label: 'Сложность' },
  { key: 'workload', label: 'Нагрузка' },
  { key: 'interest', label: 'Интерес' },
  { key: 'usefulness', label: 'Полезность' },
  { key: 'recommendation', label: 'Готовность рекомендовать' },
] as const;

export type ReviewCriterion = (typeof REVIEW_CRITERIA)[number]['key'];
export type ReviewInput = {
  disciplineId: string;
  ratings: Record<ReviewCriterion, number>;
  experience: string;
  advice: string;
};

export type ReviewStatus = 'local' | 'pending' | 'published' | 'rejected';
export type UserReview = ReviewInput & { id: string; status: ReviewStatus };
export type ReviewExcerpt = Discipline['reviews'][number];
