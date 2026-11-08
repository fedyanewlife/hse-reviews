import { useEffect, useState } from 'react';
import { catalogRepository } from './catalogRepository';
import type { ReviewInput, UserReview } from './catalogTypes';

type AccountState = {
  status: 'loading' | 'ready' | 'error';
  favorites: string[];
  reviews: UserReview[];
  error: unknown;
};

/** Все изменения подтверждаются источником данных до обновления интерфейса. */
export function useCatalogAccount() {
  const [account, setAccount] = useState<AccountState>({
    status: 'loading',
    favorites: [],
    reviews: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [savingReview, setSavingReview] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      catalogRepository.listFavorites(controller.signal),
      catalogRepository.listMyReviews(controller.signal),
    ])
      .then(([favorites, reviews]) => {
        if (!controller.signal.aborted)
          setAccount({ status: 'ready', favorites, reviews, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setAccount((state) => ({ ...state, status: 'error', error }));
      });
    return () => controller.abort();
  }, [attempt]);

  async function toggleFavorite(id: string) {
    if (account.status !== 'ready' || pendingIds.includes(id)) return;
    const selected = !account.favorites.includes(id);
    setPendingIds((ids) => [...ids, id]);
    try {
      await catalogRepository.setFavorite(id, selected);
      setAccount((state) => ({
        ...state,
        favorites: selected
          ? [...new Set([...state.favorites, id])]
          : state.favorites.filter((value) => value !== id),
      }));
    } finally {
      setPendingIds((ids) => ids.filter((value) => value !== id));
    }
  }

  async function createReview(input: ReviewInput) {
    setSavingReview(true);
    try {
      const review = await catalogRepository.createReview(input);
      setAccount((state) => ({ ...state, reviews: [review, ...state.reviews] }));
      return review;
    } finally {
      setSavingReview(false);
    }
  }

  function retry() {
    setAccount((state) => ({ ...state, status: 'loading', error: null }));
    setAttempt((value) => value + 1);
  }
  return { ...account, pendingIds, savingReview, toggleFavorite, createReview, retry };
}
