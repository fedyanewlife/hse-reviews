import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Heart, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { Icon } from '../../components/ui/Icon';
import { SearchField } from '../../components/ui/SearchField';
import { cx } from '../../lib/cx';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { isDemoCatalog } from './catalogRepository';
import { CatalogHeader } from './CatalogHeader';
import { useCatalogAccount } from './useCatalogAccount';
import { CatalogCard, CatalogSkeleton } from './CatalogCard';
import { CatalogFilterBar } from './CatalogFilterBar';
import { HeroReviews } from './HeroReviews';
import { FavoriteHeroCards } from './FavoriteHeroCards';
import { MyReviewsPage } from '../my-reviews/MyReviewsPage';
import { personalReviewPreview } from '../my-reviews/myReviewDemo';
import { reviewFormHref } from '../review-form/reviewFormModel';
import {
  minorCount,
  reviewCount,
  PAGE_SIZE,
  selectDisciplines,
  selectFavoriteDisciplines,
} from './catalogModel';
import { CATALOG_DIRECTIONS, type CatalogFilters, type CatalogView } from './catalogTypes';
import { useCatalog } from './useCatalog';
import styles from './CatalogPage.module.css';

const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  direction: 'all',
  faculties: [],
  minimumRating: 0,
  sort: 'reviews',
};

export function CatalogPage() {
  const preview = isDemoCatalog ? new URLSearchParams(window.location.search).get('state') : null;
  const { items, status, error: catalogError, retry } = useCatalog(preview);
  const account = useCatalogAccount();
  const favorites = account.favorites;
  const [view, setView] = useState<CatalogView>(() => {
    const value = new URLSearchParams(window.location.search).get('view');
    return value === 'favorites' || value === 'reviews' ? value : 'disciplines';
  });
  useEffect(() => {
    const title = { disciplines: 'Дисциплины', favorites: 'Избранное', reviews: 'Мои отзывы' }[
      view
    ];
    document.title = `${title} — ОтзоВышка`;
  }, [view]);
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...DEFAULT_FILTERS,
    query: preview === 'empty' ? 'Квантовая кулинария' : '',
  }));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [notice, setNotice] = useState('');
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

  const favoriteItems = selectFavoriteDisciplines(items, favorites);
  const source = view === 'favorites' ? favoriteItems : items;
  const filtered = selectDisciplines(source, filters);
  const visible = filtered.slice(0, visibleCount);
  const loading =
    status === 'loading' || (view === 'favorites' && account.favoritesStatus === 'loading');
  const viewError =
    status === 'error'
      ? catalogError
      : view === 'favorites' && account.favoritesStatus === 'error'
        ? account.favoritesError
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
    const url = new URL(window.location.href);
    if (next === 'disciplines') url.searchParams.delete('view');
    else url.searchParams.set('view', next);
    window.history.replaceState(null, '', url);
  }
  async function toggleFavorite(id: string) {
    try {
      await account.toggleFavorite(id);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        К содержимому
      </a>
      <CatalogHeader view={view} onViewChange={changeView} onError={setNotice} />

      <main id="main-content" className={styles.main}>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        {view === 'reviews' ? (
          <MyReviewsPage
            reviews={account.reviews}
            status={account.reviewsStatus}
            error={account.reviewsError}
            onRetry={account.retry}
            items={items}
            catalogStatus={status}
            onCatalogRetry={retry}
            preview={
              isDemoCatalog
                ? personalReviewPreview(
                    new URLSearchParams(window.location.search).get('reviewPreview'),
                  )
                : null
            }
          />
        ) : (
          <>
            <section
              className={cx(
                styles.hero,
                view === 'favorites' && styles.heroFavorites,
                view === 'favorites' && !favoriteItems.length && styles.heroFavoritesEmpty,
              )}
              aria-labelledby="catalog-title"
              onMouseEnter={() => setHeroHovered(true)}
              onMouseLeave={() => setHeroHovered(false)}
              onFocusCapture={() => setHeroFocused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setHeroFocused(false);
              }}
            >
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow} role={view === 'favorites' ? 'status' : undefined}>
                  {view === 'favorites' ? (
                    status === 'ready' && account.favoritesStatus === 'ready' ? (
                      `${minorCount(favoriteItems.length)} в избранном`
                    ) : (
                      'Ваши сохранённые майноры'
                    )
                  ) : status === 'ready' ? (
                    <>
                      {minorCount(isDemoCatalog ? 30 : items.length)}{' '}
                      <span aria-hidden="true">·</span>{' '}
                      {reviewCount(isDemoCatalog ? 200 : totalReviews)}
                    </>
                  ) : (
                    'Майноры Вышки'
                  )}
                </p>
                <h1 id="catalog-title">
                  {view === 'favorites' ? 'Избранное' : 'Список дисциплин'}
                </h1>
                {view === 'disciplines' ? (
                  <a className={styles.heroReviewLink} href={reviewFormHref()}>
                    Уже прошёл майнор? Расскажи, как было <Icon icon={ArrowRight} size={16} />
                  </a>
                ) : (
                  <button
                    type="button"
                    className={styles.heroReviewLink}
                    onClick={
                      view === 'favorites'
                        ? () => {
                            if (favoriteItems.length)
                              document
                                .getElementById('catalog-results')
                                ?.scrollIntoView({ block: 'start' });
                            else changeView('disciplines');
                          }
                        : undefined
                    }
                  >
                    {view === 'favorites'
                      ? favoriteItems.length
                        ? 'Сравни и выбери свой'
                        : 'Найди майнор и сохрани его'
                      : 'Уже прошёл майнор? Расскажи, как было'}{' '}
                    <Icon icon={ArrowRight} size={16} />
                  </button>
                )}
              </div>
              {view === 'favorites' ? (
                <FavoriteHeroCards items={favoriteItems} />
              ) : (
                <HeroReviews
                  key={heroReviews.map((review) => review.id).join('|')}
                  reviews={heroReviews}
                  paused={heroHovered || heroFocused}
                />
              )}
            </section>
            {status === 'ready' &&
              view === 'disciplines' &&
              account.favoritesStatus === 'error' && (
                <div className={styles.notice} role="alert">
                  <p>Не удалось загрузить избранное. {errorMessage(account.favoritesError)}</p>
                  {isUnauthorized(account.favoritesError) ? (
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

            <section
              id="catalog-results"
              className={styles.results}
              aria-label="Дисциплины"
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
                    {isUnauthorized(viewError)
                      ? 'Войдите в аккаунт'
                      : 'Не удалось загрузить список'}
                  </h2>
                  <p>{errorMessage(viewError)}</p>
                  {isUnauthorized(viewError) ? (
                    <Button href="/" variant="secondary">
                      На страницу входа
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={status === 'error' ? retry : account.retry}
                    >
                      Повторить загрузку
                    </Button>
                  )}
                </div>
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
                          account.favoritesStatus !== 'ready' ||
                          account.pendingIds.includes(item.id)
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
            {status === 'ready' && filtered.length > 0 && (
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
          </>
        )}
      </main>
    </div>
  );
}
