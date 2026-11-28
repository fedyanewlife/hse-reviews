import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Pencil, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { SearchField } from '../../components/ui/SearchField';
import { cx } from '../../lib/cx';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { isDemoCatalog } from './catalogRepository';
import { CatalogHeader } from './CatalogHeader';
import { CatalogCard, CatalogSkeleton } from './CatalogCard';
import { CatalogFilterBar } from './CatalogFilterBar';
import { HeroReviews } from './HeroReviews';
import { reviewFormHref } from '../review-form/reviewFormModel';
import {
  DEFAULT_CATALOG_FILTERS,
  minorCount,
  reviewCount,
  PAGE_SIZE,
  selectDisciplines,
} from './catalogModel';
import type { CatalogFilters } from './catalogTypes';
import { useCatalog } from './useCatalog';
import styles from './CatalogPage.module.css';

export function CatalogPage() {
  const preview = isDemoCatalog ? new URLSearchParams(window.location.search).get('state') : null;
  const { items, status, error: catalogError, retry } = useCatalog(preview);
  useEffect(() => {
    document.title = 'Майноры — ОтзоВышка';
  }, []);
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...DEFAULT_CATALOG_FILTERS,
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

  const filtered = selectDisciplines(items, filters);
  const visible = filtered.slice(0, visibleCount);
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
    setFilters({ ...DEFAULT_CATALOG_FILTERS });
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        К содержимому
      </a>
      <CatalogHeader onError={setNotice} />

      <main id="main-content" className={styles.main}>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        <section
          className={cx(styles.hero, styles.heroCatalog)}
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
              Прошёл майнор?
              <br />
              Расскажи, как было
            </h1>
            <Button className={styles.heroReviewButton} href={reviewFormHref()} size="l">
              <Icon icon={Pencil} size={18} />
              Оставить отзыв
            </Button>
          </div>
          <HeroReviews
            key={heroReviews.map((review) => review.id).join('|')}
            reviews={heroReviews}
            paused={heroHovered || heroFocused}
          />
        </section>

        <div className={styles.filterRow}>
          <SearchField
            id={searchId}
            className={styles.search}
            size="l"
            value={filters.query}
            onChange={(query) => updateFilters({ query })}
            placeholder="Найти майнор"
          />
          <CatalogFilterBar filters={filters} onChange={updateFilters} />
        </div>
        {status === 'ready' && (
          <p className={styles.resultCount} role="status">
            {minorCount(filtered.length)}
          </p>
        )}
        <section
          id="catalog-results"
          className={styles.results}
          aria-label="Майноры"
          aria-busy={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <p className={styles.loadingMessage} role="status">
                Ищем подходящие майноры…
              </p>
              <CatalogSkeleton />
            </>
          ) : status === 'error' ? (
            <div className={styles.empty}>
              <h2>
                {isUnauthorized(catalogError) ? 'Войдите в аккаунт' : 'Не удалось загрузить список'}
              </h2>
              <p>{errorMessage(catalogError)}</p>
              {isUnauthorized(catalogError) ? (
                <Button href="/" variant="secondary">
                  На страницу входа
                </Button>
              ) : (
                <Button variant="secondary" onClick={retry}>
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
                  <CatalogCard item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <Icon icon={Search} size={24} className={styles.emptyIcon} />
              <h2>Пока ничего не нашлось</h2>
              <p>
                Попробуйте другое название или уберите часть фильтров. Иногда достаточно одного
                слова.
              </p>
              <Button variant="secondary" onClick={resetFilters}>
                Сбросить поиск и фильтры
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
                Показать ещё майноры <Icon icon={ArrowDown} size={16} />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
