import { useEffect, useState } from 'react';
import type { Discipline } from './catalogTypes';
import { catalogRepository } from './catalogRepository';

type CatalogData = {
  status: 'loading' | 'ready' | 'error';
  items: readonly Discipline[];
  error: unknown;
};

export function useCatalog(preview: string | null) {
  const [data, setData] = useState<CatalogData>({ status: 'loading', items: [], error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (preview === 'loading') return;
    const controller = new AbortController();
    catalogRepository
      .listDisciplines(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setData({ status: 'ready', items, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setData({ status: 'error', items: [], error });
      });
    return () => {
      controller.abort();
    };
  }, [preview, attempt]);

  const retry = () => {
    setData({ status: 'loading', items: [], error: null });
    setAttempt((value) => value + 1);
  };
  return { ...data, retry };
}
