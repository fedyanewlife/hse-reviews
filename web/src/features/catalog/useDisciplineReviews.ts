import { useEffect, useState } from 'react';
import { catalogRepository } from './catalogRepository';
import type { PublishedReview } from '../discipline/disciplineTypes';

type ReviewState = {
  id: string | null;
  status: 'loading' | 'ready' | 'error';
  items: readonly PublishedReview[];
  error: unknown;
};

export function useDisciplineReviews(id: string | null) {
  const [state, setState] = useState<ReviewState>({
    id: null,
    status: 'loading',
    items: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    catalogRepository
      .listPublishedReviews(id, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setState({ id, status: 'ready', items, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ id, status: 'error', items: [], error });
      });
    return () => controller.abort();
  }, [id, attempt]);
  const retry = () => {
    setState({ id, status: 'loading', items: [], error: null });
    setAttempt((value) => value + 1);
  };
  return {
    ...(state.id === id ? state : { id, status: 'loading' as const, items: [], error: null }),
    retry,
  };
}
