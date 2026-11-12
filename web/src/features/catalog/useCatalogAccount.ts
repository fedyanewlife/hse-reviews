import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/client';
import { assertCanSubmitReview } from '../my-reviews/myReviewModel';
import { catalogRepository } from './catalogRepository';
import type { ReviewInput, UserReview } from './catalogTypes';

type AccountState = {
  favoritesStatus: 'loading' | 'ready' | 'error';
  reviewsStatus: 'loading' | 'ready' | 'error';
  favorites: string[];
  reviews: UserReview[];
  favoritesError: unknown;
  reviewsError: unknown;
};

/** Все изменения подтверждаются источником данных до обновления интерфейса. */
export function useCatalogAccount() {
  const [account, setAccount] = useState<AccountState>({
    favoritesStatus: 'loading',
    reviewsStatus: 'loading',
    favorites: [],
    reviews: [],
    favoritesError: null,
    reviewsError: null,
  });
  const [attempt, setAttempt] = useState(0);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [savingReview, setSavingReview] = useState(false);
  const reviewInFlight = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    catalogRepository
      .listFavorites(controller.signal)
      .then((favorites) => {
        if (!controller.signal.aborted)
          setAccount((state) => ({
            ...state,
            favoritesStatus: 'ready',
            favorites,
            favoritesError: null,
          }));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setAccount((state) => ({ ...state, favoritesStatus: 'error', favoritesError: error }));
      });
    catalogRepository
      .listMyReviews(controller.signal)
      .then((reviews) => {
        if (!controller.signal.aborted)
          setAccount((state) => ({
            ...state,
            reviewsStatus: 'ready',
            reviews,
            reviewsError: null,
          }));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setAccount((state) => ({ ...state, reviewsStatus: 'error', reviewsError: error }));
      });
    return () => controller.abort();
  }, [attempt]);

  async function toggleFavorite(id: string) {
    if (account.favoritesStatus !== 'ready' || pendingIds.includes(id)) return;
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
    if (account.reviewsStatus !== 'ready')
      throw new ApiError(409, 'Дождись загрузки своего отзыва.');
    if (reviewInFlight.current) throw new ApiError(409, 'Отзыв уже отправляется.');
    assertCanSubmitReview(account.reviews, input.disciplineId);
    reviewInFlight.current = true;
    setSavingReview(true);
    try {
      const review = await catalogRepository.createReview(input);
      setAccount((state) => ({ ...state, reviews: [review, ...state.reviews] }));
      return review;
    } finally {
      reviewInFlight.current = false;
      setSavingReview(false);
    }
  }

  function retry() {
    setAccount((state) => ({
      ...state,
      favoritesStatus: 'loading',
      reviewsStatus: 'loading',
      favoritesError: null,
      reviewsError: null,
    }));
    setAttempt((value) => value + 1);
  }
  return { ...account, pendingIds, savingReview, toggleFavorite, createReview, retry };
}
