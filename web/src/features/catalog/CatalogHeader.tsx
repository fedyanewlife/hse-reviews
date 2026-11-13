import { useState } from 'react';
import { Sun, UserRound } from 'lucide-react';
import darkModeIcon from '../../assets/dark-mode.png';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { cx } from '../../lib/cx';
import { errorMessage } from '../../shared/api/client';
import { useTheme } from '../theme/useTheme';
import { catalogRepository, isDemoCatalog } from './catalogRepository';
import type { CatalogView } from './catalogTypes';
import styles from './CatalogPage.module.css';
import { reviewDraftStorageKey } from '../review-form/reviewFormModel';

const catalogViewHref = (view: CatalogView) =>
  view === 'disciplines' ? '/catalog' : `/catalog?view=${view}`;

export function CatalogHeader({
  view = 'disciplines',
  onViewChange,
  onError,
}: {
  view?: CatalogView;
  onViewChange?: (view: CatalogView) => void;
  onError: (message: string) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true);
    try {
      await catalogRepository.logout();
      try {
        sessionStorage.removeItem(reviewDraftStorageKey(false));
      } catch {
        /* Logout also works when browser storage is unavailable. */
      }
      window.location.assign('/');
    } catch (error) {
      onError(errorMessage(error));
      setLoggingOut(false);
    }
  }
  return (
    <header className={styles.header}>
      <a href="/catalog" className={styles.wordmark}>
        ОтзоВышка
      </a>
      <nav className={styles.nav} aria-label="Основная навигация">
        {(
          [
            { id: 'disciplines', label: 'Дисциплины' },
            { id: 'favorites', label: 'Избранное' },
            { id: 'reviews', label: 'Мои отзывы' },
          ] as const
        ).map((tab) =>
          onViewChange ? (
            <button
              key={tab.id}
              type="button"
              className={cx(styles.navItem, view === tab.id && styles.navActive)}
              aria-current={view === tab.id ? 'page' : undefined}
              onClick={() => onViewChange(tab.id)}
            >
              {tab.label}
            </button>
          ) : (
            <a
              key={tab.id}
              href={catalogViewHref(tab.id)}
              className={cx(styles.navItem, view === tab.id && styles.navActive)}
              aria-current={view === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ),
        )}
      </nav>
      <div className={styles.headerActions}>
        <IconButton
          icon={theme === 'dark' ? Sun : darkModeIcon}
          variant="secondary"
          className={styles.themeButton}
          label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          onClick={toggleTheme}
        />
        <details className={styles.profile}>
          <summary aria-label="Профиль">
            {isDemoCatalog ? (
              <span aria-hidden="true">Г</span>
            ) : (
              <Icon icon={UserRound} size={20} />
            )}
          </summary>
          <div className={styles.profileMenu}>
            <strong>{isDemoCatalog ? 'Демо-профиль' : 'Профиль'}</strong>
            {isDemoCatalog && <p>Избранное и ваши отзывы хранятся в этом браузере.</p>}
            <a href="/">Страница авторизации</a>
            {!isDemoCatalog && (
              <Button variant="ghost" disabled={loggingOut} onClick={() => void logout()}>
                Выйти
              </Button>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
