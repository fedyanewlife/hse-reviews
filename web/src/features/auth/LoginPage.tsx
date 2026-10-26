import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';
import hseMarkForDark from '../../assets/hse-dark.png';
import hseMark from '../../assets/hse.png';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { AUTH_LOGIN_URL } from '../../shared/api/routes';
import { useTheme } from '../theme/useTheme';
import { LoginShowcase } from './showcase/LoginShowcase';
import { StaffLoginForm } from './StaffLoginForm';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { theme, toggleTheme } = useTheme();
  const [staffOpen, setStaffOpen] = useState(false);
  const staffFormId = useId();
  // Витрина занимает правую половину экрана, на узких экранах её нет.
  const showShowcase = useMediaQuery('(min-width: 1024px)');
  const isDark = theme === 'dark';

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.wordmark}>ОтзоВышка</span>
          <IconButton
            icon={isDark ? Sun : Moon}
            label={isDark ? 'Светлая тема' : 'Тёмная тема'}
            onClick={toggleTheme}
          />
        </header>

        <main className={styles.main}>
          <div className={styles.hero}>
            <h1 className={styles.title}>
              Выбрать майнор
              <br />
              за&nbsp;5&nbsp;минут
            </h1>
            <p className={styles.subtitle}>Анонимные отзывы студентов Вышки</p>
          </div>

          <div className={styles.actions}>
            <Button href={AUTH_LOGIN_URL} size="l" fullWidth>
              {/* Кнопка тёмная в светлой теме и светлая в тёмной, поэтому знаки «наоборот». */}
              <img
                className={styles.hseMark}
                src={isDark ? hseMark : hseMarkForDark}
                alt=""
                width={24}
                height={24}
              />
              <span>Войти через аккаунт ВШЭ</span>
            </Button>

            <div className={styles.staffToggleRow}>
              <button
                type="button"
                className={styles.staffToggle}
                aria-expanded={staffOpen}
                aria-controls={staffFormId}
                onClick={() => setStaffOpen((open) => !open)}
              >
                <span>Вход по логину</span>
                <Icon icon={staffOpen ? ChevronUp : ChevronDown} size={16} />
              </button>
            </div>

            {staffOpen && <StaffLoginForm id={staffFormId} />}
          </div>
        </main>
      </div>

      {showShowcase && <LoginShowcase />}
    </div>
  );
}
