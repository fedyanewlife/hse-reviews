import { useEffect, useState } from 'react';
import { catalogRepository } from './catalogRepository';

type AccountState = {
  favoritesStatus: 'loading' | 'ready' | 'error';
  favorites: string[];
  favoritesError: unknown;
};

/** Все изменения подтверждаются источником данных до обновления интерфейса. */
export function useCatalogAccount() {
  const [account, setAccount] = useState<AccountState>({
    favoritesStatus: 'loading',
    favorites: [],
    favoritesError: null,
  });
  const [attempt, setAttempt] = useState(0);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
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

  function retry() {
    setAccount((state) => ({
      ...state,
      favoritesStatus: 'loading',
      favoritesError: null,
    }));
    setAttempt((value) => value + 1);
  }
  return { ...account, pendingIds, toggleFavorite, retry };
}
