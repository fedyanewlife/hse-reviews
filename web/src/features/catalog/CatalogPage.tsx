import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Heart, Pencil, Search, Sun, UserRound } from 'lucide-react';
import darkModeIcon from '../../assets/dark-mode.png';
import { Button } from '../../components/ui/Button';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { SearchField } from '../../components/ui/SearchField';
import { cx } from '../../lib/cx';
import { useTheme } from '../theme/useTheme';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { catalogRepository, isDemoCatalog } from './catalogRepository';
import { useCatalogAccount } from './useCatalogAccount';
import { CatalogCard, CatalogSkeleton } from './CatalogCard';
import { CatalogFilterBar } from './CatalogFilterBar';
import { HeroReviews } from './HeroReviews';
import { minorCount, reviewCount, PAGE_SIZE, selectDisciplines } from './catalogModel';
import {
  CATALOG_DIRECTIONS,
  REVIEW_CRITERIA,
  type CatalogFilters,
  type CatalogView,
} from './catalogTypes';
import { useCatalog } from './useCatalog';
import styles from './CatalogPage.module.css';

const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  direction: 'all',
  faculties: [],
  minimumRating: 0,
  sort: 'reviews',
};
const REVIEW_STATUS_LABELS = {
  local: 'Сохранён в этом браузере',
  pending: 'На проверке',
  published: 'Опубликован',
  rejected: 'Отклонён',
};

export function CatalogPage() {
  const preview = isDemoCatalog ? new URLSearchParams(window.location.search).get('state') : null;
  const { items, status, error: catalogError, retry } = useCatalog(preview);
  const account = useCatalogAccount();
  const favorites = account.favorites;
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<CatalogView>('disciplines');
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...DEFAULT_FILTERS,
    query: preview === 'empty' ? 'Квантовая кулинария' : '',
  }));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notice, setNotice] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const searchId = 'catalog-search';
  const loadMoreFocus = useRef<HTMLLIElement>(null);
  const shouldFocusMore = useRef(false);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const input = document.getElementById(searchId);
      if (
        input &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k' &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        input.focus();
      }
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    if (shouldFocusMore.current) {
      loadMoreFocus.current?.focus({ preventScroll: true });
      shouldFocusMore.current = false;
    }
  }, [visibleCount]);

  const source = view === 'favorites' ? items.filter((item) => favorites.includes(item.id)) : items;
  const filtered = selectDisciplines(source, filters);
  const visible = filtered.slice(0, visibleCount);
  const validReviews = account.reviews;
  const loading = status === 'loading' || (view !== 'disciplines' && account.status === 'loading');
  const viewError =
    status === 'error'
      ? catalogError
      : view !== 'disciplines' && account.status === 'error'
        ? account.error
        : null;
  const heroReviews = items.flatMap((item) =>
    item.reviews
      .map((review, index) => ({
        ...review,
        id: `${item.id}:${index}`,
        discipline: item.title,
      }))
      .filter((review) => review.text.trim()),
  );
  const totalReviews = items.reduce((total, item) => total + item.reviewCount, 0);

  function updateFilters(update: Partial<CatalogFilters>) {
    setFilters((current) => ({ ...current, ...update }));
    setVisibleCount(PAGE_SIZE);
  }
  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS });
    setVisibleCount(PAGE_SIZE);
  }
  function changeView(next: CatalogView) {
    setView(next);
    setVisibleCount(PAGE_SIZE);
  }
  async function toggleFavorite(id: string) {
    try {
      await account.toggleFavorite(id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await catalogRepository.logout();
      window.location.assign('/');
    } catch (error) {
      setNotice(errorMessage(error));
      setLoggingOut(false);
    }
  }

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        К содержимому
      </a>
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
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cx(styles.navItem, view === tab.id && styles.navActive)}
              aria-current={view === tab.id ? 'page' : undefined}
              onClick={() => changeView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
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

      <main id="main-content" className={styles.main}>
        <section
          className={styles.hero}
          aria-labelledby="catalog-title"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
          onFocusCapture={() => setHeroFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHeroFocused(false);
          }}
        >
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              {status === 'ready' ? (
                <>
                  {minorCount(isDemoCatalog ? 30 : items.length)} <span aria-hidden="true">·</span>{' '}
                  {reviewCount(isDemoCatalog ? 200 : totalReviews)}
                </>
              ) : (
                'Майноры Вышки'
              )}
            </p>
            <h1 id="catalog-title">
              {view === 'favorites'
                ? 'Избранное'
                : view === 'reviews'
                  ? 'Мои отзывы'
                  : 'Список дисциплин'}
            </h1>
            <button type="button" className={styles.heroReviewLink}>
              Уже прошёл майнор? Расскажи, как было <Icon icon={ArrowRight} size={16} />
            </button>
          </div>
          <HeroReviews
            key={heroReviews.map((review) => review.id).join('|')}
            reviews={heroReviews}
            paused={heroHovered || heroFocused}
          />
        </section>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        {status === 'ready' && view === 'disciplines' && account.status === 'error' && (
          <div className={styles.notice} role="alert">
            <p>Не удалось загрузить избранное и ваши отзывы. {errorMessage(account.error)}</p>
            {isUnauthorized(account.error) ? (
              <Button href="/" variant="secondary">
                Войти
              </Button>
            ) : (
              <Button variant="secondary" onClick={account.retry}>
                Повторить
              </Button>
            )}
          </div>
        )}

        {view !== 'reviews' && (
          <>
            <div className={styles.searchRow}>
              <SearchField
                id={searchId}
                className={styles.search}
                size="l"
                value={filters.query}
                onChange={(query) => updateFilters({ query })}
                placeholder="Найти дисциплину"
              />
            </div>
            <div className={styles.directions} role="group" aria-label="Направление">
              <button
                type="button"
                className={cx(
                  styles.directionButton,
                  filters.direction === 'all' && styles.directionActive,
                )}
                aria-pressed={filters.direction === 'all'}
                onClick={() => updateFilters({ direction: 'all' })}
              >
                Все направления
              </button>
              {CATALOG_DIRECTIONS.map(({ id, label }) => (
                <button
                  type="button"
                  key={id}
                  className={cx(
                    styles.directionButton,
                    filters.direction === id && styles.directionActive,
                  )}
                  aria-pressed={filters.direction === id}
                  onClick={() => updateFilters({ direction: id })}
                >
                  <DirectionMark direction={id} label={label} size="s" />
                </button>
              ))}
            </div>
            <CatalogFilterBar
              items={items}
              source={source}
              filters={filters}
              count={filtered.length}
              loading={status === 'loading'}
              onChange={updateFilters}
            />
          </>
        )}

        <section
          className={styles.results}
          aria-label={view === 'reviews' ? 'Ваши отзывы' : 'Дисциплины'}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <p className={styles.loadingMessage} role="status">
                Ищем подходящие дисциплины…
              </p>
              <CatalogSkeleton />
            </>
          ) : viewError ? (
            <div className={styles.empty}>
              <h2>
                {isUnauthorized(viewError) ? 'Войдите в аккаунт' : 'Не удалось загрузить список'}
              </h2>
              <p>{errorMessage(viewError)}</p>
              {isUnauthorized(viewError) ? (
                <Button href="/" variant="secondary">
                  На страницу входа
                </Button>
              ) : (
                <Button variant="secondary" onClick={status === 'error' ? retry : account.retry}>
                  Повторить загрузку
                </Button>
              )}
            </div>
          ) : view === 'reviews' ? (
            validReviews.length ? (
              <div className={styles.myReviews}>
                {validReviews.map((review) => (
                  <article key={review.id} className={styles.myReview}>
                    <p className={styles.savedLabel}>{REVIEW_STATUS_LABELS[review.status]}</p>
                    <h2>
                      {items.find((item) => item.id === review.disciplineId)?.title ??
                        'Название дисциплины недоступно'}
                    </h2>
                    <dl className={styles.criteria}>
                      {REVIEW_CRITERIA.map(({ key, label }) => (
                        <div key={key}>
                          <dt>{label}</dt>
                          <dd>{review.ratings[key]} / 5</dd>
                        </div>
                      ))}
                    </dl>
                    {review.experience && <p>{review.experience}</p>}
                    {review.advice && (
                      <p>
                        <strong>Совет:</strong> {review.advice}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <Icon icon={Pencil} size={24} className={styles.emptyIcon} />
                <h2>Пока нет ваших отзывов</h2>
                <p>Здесь появятся ваши отзывы о дисциплинах.</p>
              </div>
            )
          ) : visible.length ? (
            <ul className={styles.grid}>
              {visible.map((item, index) => (
                <li
                  key={item.id}
                  tabIndex={-1}
                  ref={index === visibleCount - PAGE_SIZE ? loadMoreFocus : undefined}
                >
                  <CatalogCard
                    item={item}
                    favorite={favorites.includes(item.id)}
                    favoriteDisabled={
                      account.status !== 'ready' || account.pendingIds.includes(item.id)
                    }
                    onFavorite={() => void toggleFavorite(item.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <Icon
                icon={view === 'favorites' && !source.length ? Heart : Search}
                size={24}
                className={styles.emptyIcon}
              />
              <h2>
                {view === 'favorites' && !source.length
                  ? 'Сохраните то, что интересно'
                  : 'Пока ничего не нашлось'}
              </h2>
              <p>
                {view === 'favorites' && !source.length
                  ? 'Нажмите на сердечко в карточке — дисциплина появится здесь.'
                  : 'Попробуйте другое название или уберите часть фильтров. Иногда достаточно одного слова.'}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  resetFilters();
                  if (view === 'favorites' && !source.length) changeView('disciplines');
                }}
              >
                {view === 'favorites' && !source.length
                  ? 'Посмотреть дисциплины'
                  : 'Сбросить поиск и фильтры'}
              </Button>
            </div>
          )}
        </section>
        {status === 'ready' && view !== 'reviews' && filtered.length > 0 && (
          <div className={styles.more}>
            {filtered.length > visibleCount && (
              <Button
                variant="secondary"
                onClick={() => {
                  shouldFocusMore.current = true;
                  setVisibleCount((value) => value + PAGE_SIZE);
                }}
              >
                Показать ещё дисциплины <Icon icon={ArrowDown} size={16} />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
