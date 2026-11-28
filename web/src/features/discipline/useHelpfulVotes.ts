import { useState } from 'react';
import { CatalogStorageError } from '../../shared/api/client';

const KEY = 'otz-demo-helpful-review-ids';
export function useHelpfulVotes(enabled: boolean, onError: (error: string) => void) {
  const [votes, setVotes] = useState<string[]>(() => {
    if (!enabled) return [];
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return Array.isArray(stored)
        ? [...new Set(stored.filter((id): id is string => typeof id === 'string'))]
        : [];
    } catch {
      return [];
    }
  });
  function toggle(id: string) {
    if (!enabled) return;
    const next = votes.includes(id) ? votes.filter((value) => value !== id) : [...votes, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setVotes(next);
    } catch {
      onError(new CatalogStorageError().message);
    }
  }
  return { votes, toggle };
}
