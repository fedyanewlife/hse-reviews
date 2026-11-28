import { useEffect, useState } from 'react';
import { catalogRepository } from './catalogRepository';
import type { DisciplineReviews } from '../discipline/disciplineTypes';

type ReviewState = DisciplineReviews & {
  id: string | null;
  status: 'loading' | 'ready' | 'error';
  error: unknown;
};

const emptyReviews = { items: [], themes: [] } satisfies DisciplineReviews;

export function useDisciplineReviews(id: string | null) {
  const [state, setState] = useState<ReviewState>({
    id: null,
    status: 'loading',
    ...emptyReviews,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    catalogRepository
      .getDisciplineReviews(id, controller.signal)
      .then((reviews) => {
        if (!controller.signal.aborted) setState({ id, status: 'ready', ...reviews, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ id, status: 'error', ...emptyReviews, error });
      });
    return () => controller.abort();
  }, [id, attempt]);
  const retry = () => {
    setState({ id, status: 'loading', ...emptyReviews, error: null });
    setAttempt((value) => value + 1);
  };
  return {
    ...(state.id === id ? state : { id, status: 'loading' as const, ...emptyReviews, error: null }),
    retry,
  };
}
