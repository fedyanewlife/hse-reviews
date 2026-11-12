import {
  CATALOG_DIRECTIONS,
  REVIEW_CRITERIA,
  type CatalogFilters,
  type Discipline,
  type UserReview,
} from './catalogTypes';

export const FAVORITES_KEY = 'otz-catalog-demo-favorites';
export const REVIEWS_KEY = 'otz-catalog-demo-reviews';
export const PAGE_SIZE = 6;

/** Keep saved order; deleted or unavailable disciplines never become placeholder cards. */
export function selectFavoriteDisciplines(
  items: readonly Discipline[],
  favorites: readonly string[],
) {
  const byId = new Map(items.map((item) => [item.id, item]));
  return [...new Set(favorites)].flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();

export function selectDisciplines(items: readonly Discipline[], filters: CatalogFilters) {
  const words = normalize(filters.query).split(/\s+/).filter(Boolean);
  return items
    .filter((item) => {
      const label = CATALOG_DIRECTIONS.find((value) => value.id === item.direction)?.label ?? '';
      const text = normalize(`${item.title} ${item.faculty} ${item.facultyLabel ?? ''} ${label}`);
      return (
        words.every((word) => text.includes(word)) &&
        (filters.direction === 'all' || item.direction === filters.direction) &&
        (!filters.faculties.length || filters.faculties.includes(item.faculty)) &&
        (filters.minimumRating === 0 ||
          (item.rating !== null && item.rating >= filters.minimumRating))
      );
    })
    .sort((a, b) => {
      const tie = a.title.localeCompare(b.title, 'ru');
      if (filters.sort === 'reviews') return b.reviewCount - a.reviewCount || tie;
      if (filters.sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1) || tie;
      return tie;
    });
}

export function parseFavorites(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
      : [];
  } catch {
    return [];
  }
}

export function parseReviews(raw: string | null): UserReview[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is UserReview => {
        if (!item || typeof item !== 'object') return false;
        const review = item as Partial<UserReview>;
        return (
          typeof review.id === 'string' &&
          typeof review.disciplineId === 'string' &&
          typeof review.experience === 'string' &&
          typeof review.advice === 'string' &&
          REVIEW_CRITERIA.every(({ key }) => {
            const rating = review.ratings?.[key];
            return (
              typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5
            );
          })
        );
      })
      .map((review) => ({ ...review, status: 'local' as const }));
  } catch {
    return [];
  }
}

export function disciplineCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun =
    mod10 === 1 && mod100 !== 11
      ? 'дисциплина'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'дисциплины'
        : 'дисциплин';
  return `${count} ${noun}`;
}

export function minorCount(count: number) {
  const forms = { one: 'майнор', few: 'майнора', other: 'майноров' };
  const rule = new Intl.PluralRules('ru').select(count);
  const noun = rule === 'one' || rule === 'few' ? forms[rule] : forms.other;
  return `${count.toLocaleString('ru-RU')} ${noun}`;
}

export function reviewCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun =
    mod10 === 1 && mod100 !== 11
      ? 'отзыв'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'отзыва'
        : 'отзывов';
  return `${count.toLocaleString('ru-RU')} ${noun}`;
}
