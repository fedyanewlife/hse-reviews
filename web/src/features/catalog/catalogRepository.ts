import type { Discipline, ReviewExcerpt, ReviewInput, UserReview } from './catalogTypes';
import { createApiCatalogRepository } from './catalogApi';

/** UI не знает, где хранятся данные: обе реализации соблюдают один контракт. */
export interface CatalogRepository {
  listDisciplines(signal?: AbortSignal): Promise<readonly Discipline[]>;
  listReviews(id: string, signal?: AbortSignal): Promise<readonly ReviewExcerpt[]>;
  listFavorites(signal?: AbortSignal): Promise<string[]>;
  setFavorite(id: string, selected: boolean): Promise<void>;
  listMyReviews(signal?: AbortSignal): Promise<UserReview[]>;
  createReview(input: ReviewInput): Promise<UserReview>;
  logout(): Promise<void>;
}

export function resolveCatalogMode(
  value: string | undefined,
  development: boolean,
): 'demo' | 'api' {
  if (value === 'demo' || value === 'api') return value;
  if (value !== undefined && value !== '') throw new Error('VITE_CATALOG_MODE must be demo or api');
  return development ? 'demo' : 'api';
}

export const catalogMode = resolveCatalogMode(
  import.meta.env.VITE_CATALOG_MODE,
  import.meta.env.DEV,
);
export const isDemoCatalog = catalogMode === 'demo';

// Примеры и browser storage загружаются только при явном использовании demo-режима.
const demo = () => import('./catalogDemoRepository').then((module) => module.demoCatalogRepository);
export const catalogRepository: CatalogRepository = isDemoCatalog
  ? {
      listDisciplines: async (signal) => (await demo()).listDisciplines(signal),
      listReviews: async (id, signal) => (await demo()).listReviews(id, signal),
      listFavorites: async (signal) => (await demo()).listFavorites(signal),
      setFavorite: async (id, selected) => (await demo()).setFavorite(id, selected),
      listMyReviews: async (signal) => (await demo()).listMyReviews(signal),
      createReview: async (input) => (await demo()).createReview(input),
      logout: async () => (await demo()).logout(),
    }
  : createApiCatalogRepository({ baseUrl: import.meta.env.VITE_API_BASE_URL });
