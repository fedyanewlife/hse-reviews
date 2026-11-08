import { useEffect, useState } from 'react';
import { catalogRepository } from './catalogRepository';
import type { ReviewExcerpt } from './catalogTypes';

type ReviewState = {
  id: string | null;
  status: 'loading' | 'ready' | 'error';
  items: readonly ReviewExcerpt[];
  error: unknown;
};

export function useDisciplineReviews(id: string | null) {
  const [state, setState] = useState<ReviewState>({
    id: null,
    status: 'loading',
    items: [],
    error: null,
  });
  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    catalogRepository
      .listReviews(id, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setState({ id, status: 'ready', items, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ id, status: 'error', items: [], error });
      });
    return () => controller.abort();
  }, [id]);
  return state.id === id ? state : { id, status: 'loading' as const, items: [], error: null };
}
