import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

// Тот же ключ читает inline-скрипт в index.html до первой отрисовки.
const STORAGE_KEY = 'otz-theme';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  const toggleTheme = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Хранилище может быть недоступно (приватный режим) — тема просто не запомнится.
    }
    setTheme(next);
  }, []);

  return { theme, toggleTheme };
}
