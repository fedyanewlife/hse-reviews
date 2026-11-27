import { ApiError, CatalogStorageError } from '../../shared/api/client';
import { DEMO_DISCIPLINES } from './catalogDemo';
import { FAVORITES_KEY, parseFavorites } from './catalogModel';
import type { CatalogRepository } from './catalogRepository';
import { demoPublishedReviews, demoReviewInsights } from '../discipline/disciplineDemo';
import { reviewSummary } from '../discipline/disciplineModel';

const REVIEW_MARKER_KEY = 'otz-catalog-demo-reviews';

type DemoStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createDemoCatalogRepository(storage: DemoStorage): CatalogRepository {
  function read(key: string) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }
  function write(key: string, value: unknown) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      throw new CatalogStorageError();
    }
  }
  function hasSubmittedReview() {
    const stored = read(REVIEW_MARKER_KEY);
    if (stored === 'true') return true;
    let legacy: unknown;
    try {
      legacy = JSON.parse(stored ?? 'null');
    } catch {
      return false;
    }
    if (!Array.isArray(legacy) || !legacy.length) return false;

    // Keep the limit for existing demo submissions without retaining their contents.
    try {
      write(REVIEW_MARKER_KEY, true);
    } catch {
      // The old entry still counts even if the browser refuses to rewrite it.
    }
    return true;
  }
  hasSubmittedReview();
  return {
    listDisciplines: async () =>
      DEMO_DISCIPLINES.map((item) => {
        const summary = reviewSummary(demoPublishedReviews(item));
        return {
          ...item,
          rating:
            summary.averages.recommendation === null
              ? null
              : Number(summary.averages.recommendation.toFixed(1)),
          reviewCount: summary.count,
        };
      }),
    listReviews: async (id) => DEMO_DISCIPLINES.find((item) => item.id === id)?.reviews ?? [],
    getDisciplineReviews: async (id) => {
      const item = DEMO_DISCIPLINES.find((value) => value.id === id);
      const items = item ? demoPublishedReviews(item) : [];
      return { items, ...demoReviewInsights(items) };
    },
    listFavorites: async () => parseFavorites(read(FAVORITES_KEY)),
    setFavorite: async (id, selected) => {
      const ids = parseFavorites(read(FAVORITES_KEY));
      write(
        FAVORITES_KEY,
        selected ? [...new Set([...ids, id])] : ids.filter((value) => value !== id),
      );
    },
    createReview: async () => {
      if (hasSubmittedReview()) throw new ApiError(409, 'В этом браузере отзыв уже отправлен.');
      write(REVIEW_MARKER_KEY, true);
      return 'local';
    },
    logout: async () => {},
  };
}

export const demoCatalogRepository = createDemoCatalogRepository({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
