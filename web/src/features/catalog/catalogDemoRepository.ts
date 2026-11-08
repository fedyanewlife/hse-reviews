import { CatalogStorageError } from '../../shared/api/client';
import { DEMO_DISCIPLINES } from './catalogDemo';
import { FAVORITES_KEY, parseFavorites, parseReviews, REVIEWS_KEY } from './catalogModel';
import type { CatalogRepository } from './catalogRepository';

type DemoStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createDemoCatalogRepository(
  storage: DemoStorage,
  makeId = () => crypto.randomUUID(),
): CatalogRepository {
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
  return {
    listDisciplines: async () => DEMO_DISCIPLINES,
    listReviews: async (id) => DEMO_DISCIPLINES.find((item) => item.id === id)?.reviews ?? [],
    listFavorites: async () => parseFavorites(read(FAVORITES_KEY)),
    setFavorite: async (id, selected) => {
      const ids = parseFavorites(read(FAVORITES_KEY));
      write(
        FAVORITES_KEY,
        selected ? [...new Set([...ids, id])] : ids.filter((value) => value !== id),
      );
    },
    listMyReviews: async () => parseReviews(read(REVIEWS_KEY)),
    createReview: async (input) => {
      const review = { ...input, id: makeId(), status: 'local' as const };
      write(REVIEWS_KEY, [review, ...parseReviews(read(REVIEWS_KEY))]);
      return review;
    },
    logout: async () => {},
  };
}

export const demoCatalogRepository = createDemoCatalogRepository({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
