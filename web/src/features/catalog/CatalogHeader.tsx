import { useState } from 'react';
import { LogOut, Sun } from 'lucide-react';
import darkModeIcon from '../../assets/dark-mode.png';
import { IconButton } from '../../components/ui/IconButton';
import { errorMessage } from '../../shared/api/client';
import { useTheme } from '../theme/useTheme';
import { catalogRepository, isDemoCatalog } from './catalogRepository';
import styles from './CatalogPage.module.css';
import { reviewDraftStorageKey } from '../review-form/reviewFormModel';

export function CatalogHeader({ onError }: { onError: (message: string) => void }) {
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  async function logout() {
    setLoggingOut(true);
    try {
      await catalogRepository.logout();
      if (!isDemoCatalog) {
        try {
          sessionStorage.removeItem(reviewDraftStorageKey(false));
        } catch {
          /* Logout also works when browser storage is unavailable. */
        }
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
        <a href="/catalog" className={styles.navItem} aria-current="page">
          Каталог
        </a>
      </nav>
      <div className={styles.headerActions}>
        <IconButton
          icon={theme === 'dark' ? Sun : darkModeIcon}
          variant="secondary"
          className={styles.themeButton}
          label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          onClick={toggleTheme}
        />
        <IconButton
          icon={LogOut}
          variant="secondary"
          label="Выйти из аккаунта"
          disabled={loggingOut}
          onClick={() => void logout()}
        />
      </div>
    </header>
  );
}
