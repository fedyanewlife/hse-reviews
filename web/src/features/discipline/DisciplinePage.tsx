import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, Heart, Pencil, Sparkles, Star, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { DIRECTIONS } from '../../components/ui/directions';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { cx } from '../../lib/cx';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { CatalogHeader } from '../catalog/CatalogHeader';
import { isDemoCatalog } from '../catalog/catalogRepository';
import { reviewCount } from '../catalog/catalogModel';
import { useCatalog } from '../catalog/useCatalog';
import { useCatalogAccount } from '../catalog/useCatalogAccount';
import { useDisciplineReviews } from '../catalog/useDisciplineReviews';
import { disciplineHref, reviewSummary, sortReviews } from './disciplineModel';
import { DisciplineRatings } from './DisciplineRatings';
import { DisciplineReviewCard } from './DisciplineReviewCard';
import type { ReviewSort } from './disciplineTypes';
import { useHelpfulVotes } from './useHelpfulVotes';
import styles from './DisciplinePage.module.css';
import { reviewFormHref } from '../review-form/reviewFormModel';

export function DisciplinePage({ disciplineId }: { disciplineId: string }) {
  const catalog = useCatalog(null);
  const item = catalog.items.find((value) => value.id === disciplineId);
  const data = useDisciplineReviews(item?.id ?? null);
  const account = useCatalogAccount();
  const [notice, setNotice] = useState('');
  const [themeId, setThemeId] = useState<string | null>(null);
  const [sort, setSort] = useState<ReviewSort>('helpful');
  const [limit, setLimit] = useState(6);
  const [requestedReview, setRequestedReview] = useState<{ id: string } | null>(null);
  const [heroPassed, setHeroPassed] = useState(false);
  const heroActions = useRef<HTMLDivElement>(null);
  const voting = useHelpfulVotes(isDemoCatalog, setNotice);
  const summary = reviewSummary(data.items);
  const hasHelpful = data.items.some((review) => review.helpfulCount !== null);
  const effectiveSort = !hasHelpful && sort === 'helpful' ? 'newest' : sort;
  const theme = data.themes.find((value) => value.id === themeId);
  const reviewItems = theme
    ? data.items.filter((review) => theme.reviewIds.includes(review.id))
    : data.items;
  const sorted = sortReviews(reviewItems, effectiveSort, voting.votes);
  const visible = sorted.slice(0, limit);
  const related = catalog.items
    .filter((value) => value.id !== item?.id && value.direction === item?.direction)
    .slice(0, 3);
  const favorite = account.favorites.includes(disciplineId);
  const favoriteDisabled =
    account.favoritesStatus !== 'ready' || account.pendingIds.includes(disciplineId);

  useEffect(() => {
    document.title = `${item?.title ?? 'Майнор'} — ОтзоВышка`;
  }, [item?.title]);
  useEffect(() => {
    if (!requestedReview) return;
    const element = document.getElementById(`review-${requestedReview.id}`);
    element?.scrollIntoView({ block: 'start' });
    element?.focus({ preventScroll: true });
  }, [requestedReview]);
  useEffect(() => {
    const actions = heroActions.current;
    if (!actions) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setHeroPassed(entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(actions);
    return () => observer.disconnect();
  }, [item]);

  async function toggleFavorite() {
    try {
      await account.toggleFavorite(disciplineId);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }
  function changeTheme(id: string | null) {
    setThemeId(id === themeId ? null : id);
    setLimit(6);
    document.getElementById('reviews')?.scrollIntoView({ block: 'start' });
    document.getElementById('reviews-title')?.focus({ preventScroll: true });
  }
  const sortOptions: { value: ReviewSort; label: string }[] = [
    ...(hasHelpful ? [{ value: 'helpful' as const, label: 'Полезные' }] : []),
    { value: 'newest', label: 'Новые' },
    { value: 'highest', label: 'Выше оценка' },
    { value: 'lowest', label: 'Ниже оценка' },
  ];

  return (
    <div
      className={styles.page}
      style={
        item
          ? ({
              '--discipline-accent': DIRECTIONS[item.direction].color,
              '--discipline-tint': DIRECTIONS[item.direction].bg,
            } as CSSProperties)
          : undefined
      }
    >
      <a href="#main-content" className={styles.skipLink}>
        К содержимому
      </a>
      <CatalogHeader onError={setNotice} />
      <main className={styles.main} id="main-content">
        <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
          <a href="/catalog">Майноры</a>
          <span aria-hidden="true">/</span>
          <span>{item ? DIRECTIONS[item.direction].label : 'Майнор'}</span>
        </nav>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        {catalog.status === 'loading' ? (
          <section className={styles.state} aria-busy="true">
            <h1>Загружаем майнор…</h1>
            <p role="status">Собираем оценки и отзывы студентов.</p>
          </section>
        ) : catalog.status === 'error' ? (
          <section className={styles.state}>
            <h1>Не удалось загрузить майнор</h1>
            <p>{errorMessage(catalog.error)}</p>
            <Button variant="secondary" onClick={catalog.retry}>
              Попробовать снова
            </Button>
          </section>
        ) : !item ? (
          <section className={styles.state}>
            <h1>Такого майнора не нашлось</h1>
            <p>Возможно, ссылка устарела. Найдите нужный майнор в каталоге.</p>
            <Button href="/catalog">Перейти в каталог</Button>
          </section>
        ) : (
          <>
            <section className={styles.hero} aria-labelledby="discipline-title">
              <div className={styles.heroCopy}>
                <div className={styles.heroMark}>
                  <DirectionMark direction={item.direction} size="s" />
                  <span>{item.faculty}</span>
                </div>
                <h1
                  id="discipline-title"
                  className={
                    item.title.split(/\s+/).some((word) => word.length > 14)
                      ? styles.longHeading
                      : undefined
                  }
                >
                  {item.title}
                </h1>
                <div className={styles.heroActions} ref={heroActions}>
                  <Button
                    href={reviewFormHref(disciplineId)}
                    size="l"
                    className={styles.heroWriteButton}
                  >
                    <Icon icon={Pencil} size={18} />
                    Оставить отзыв
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void toggleFavorite()}
                    disabled={favoriteDisabled}
                    aria-pressed={favorite}
                    aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
                    className={cx(styles.favoriteButton, favorite && styles.favoriteSelected)}
                  >
                    <Icon icon={Heart} size={18} />
                    <span>{favorite ? 'В избранном' : 'В избранное'}</span>
                  </Button>
                  <Button href="#reviews" variant="ghost">
                    Читать отзывы <Icon icon={ArrowDown} size={16} />
                  </Button>
                </div>
              </div>
              <section
                className={styles.recommendationPanel}
                aria-labelledby="recommendation-title"
                aria-busy={data.status === 'loading'}
              >
                <div className={styles.recommendationHeader}>
                  <h2 id="recommendation-title">Рекомендуют</h2>
                  {summary.recommendedPercent !== null && (
                    <span>{summary.recommendedPercent}%</span>
                  )}
                </div>
                <div className={styles.heroRating}>
                  <span className={styles.overall}>
                    <Icon icon={Star} size={30} className={styles.star} />
                    {(data.status === 'ready'
                      ? summary.averages.recommendation
                      : item.rating
                    )?.toLocaleString('ru-RU', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }) ?? '—'}
                  </span>
                  <a href="#reviews">
                    {data.status === 'loading'
                      ? 'Загружаем отзывы…'
                      : reviewCount(data.status === 'ready' ? summary.count : item.reviewCount)}
                  </a>
                </div>
                {summary.count > 0 && (
                  <ol className={styles.distribution} aria-label="Распределение рекомендаций">
                    {summary.distribution.map(({ rating, count }) => (
                      <li key={rating} aria-label={`${rating} из 5, ${reviewCount(count)}`}>
                        <span>
                          {rating} <Icon icon={Star} size={12} className={styles.star} />
                        </span>
                        <span className={styles.histogramTrack} aria-hidden="true">
                          <i style={{ width: `${(count / summary.count) * 100}%` }} />
                        </span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </section>
            {account.favoritesStatus === 'error' && (
              <div className={styles.notice} role="alert">
                <p>Избранное недоступно. {errorMessage(account.favoritesError)}</p>
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
            {data.status === 'error' ? (
              <section className={styles.state} id="reviews">
                <h2>Отзывы не загрузились</h2>
                <p>{errorMessage(data.error)}</p>
                <Button variant="secondary" onClick={data.retry}>
                  Повторить загрузку
                </Button>
              </section>
            ) : data.status === 'loading' ? (
              <section className={styles.loadingPanel} id="reviews" aria-busy="true">
                <p role="status">Загружаем отзывы и оценки…</p>
                {[1, 2, 3].map((value) => (
                  <span key={value} />
                ))}
              </section>
            ) : (
              <div className={styles.layout}>
                <DisciplineRatings averages={summary.averages} />
                {(data.summaryText || data.themes.length > 0) && (
                  <section className={styles.panel} aria-labelledby="review-summary-title">
                    <div className={styles.reviewSummaryHeader}>
                      <h2 id="review-summary-title">Что говорят студенты</h2>
                      {data.summaryText && (
                        <span className={styles.reviewSummaryLabel}>
                          <Icon icon={Sparkles} size={15} />
                          Сгенерировано ИИ
                        </span>
                      )}
                    </div>
                    {data.summaryText && (
                      <p className={styles.reviewSummaryText}>{data.summaryText}</p>
                    )}
                    {data.themes.length > 0 && (
                      <div className={styles.themeList} role="group" aria-label="Темы отзывов">
                        {data.themes.map(({ id, label, reviewIds }) => (
                          <button
                            type="button"
                            className={styles.themeChip}
                            key={id}
                            aria-pressed={id === theme?.id}
                            aria-controls="reviews"
                            aria-label={`${label}, ${reviewCount(reviewIds.length)}`}
                            onClick={() => changeTheme(id)}
                          >
                            {label}
                            <span className={styles.themeCount} aria-hidden="true">
                              {reviewIds.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}
                <section className={styles.reviews} id="reviews" aria-labelledby="reviews-title">
                  <div className={styles.reviewsToolbar}>
                    <div className={styles.sectionHeading}>
                      <h2 id="reviews-title" tabIndex={-1}>
                        Отзывы
                      </h2>
                      <span>{reviewItems.length}</span>
                    </div>
                    <SelectMenu
                      value={effectiveSort}
                      onChange={(value) => {
                        setSort(value);
                        setLimit(6);
                      }}
                      options={sortOptions}
                      label="Порядок отзывов"
                    />
                  </div>
                  {theme && (
                    <button
                      type="button"
                      className={cx(styles.themeChip, styles.activeTheme)}
                      aria-label={`Сбросить тему «${theme.label}»`}
                      onClick={() => changeTheme(null)}
                    >
                      {theme.label}
                      <Icon icon={X} size={16} />
                    </button>
                  )}
                  <div className={styles.reviewList}>
                    {visible.map((review) => (
                      <DisciplineReviewCard
                        key={review.id}
                        review={review}
                        voted={voting.votes.includes(review.id)}
                        votingEnabled={isDemoCatalog}
                        onVote={() => voting.toggle(review.id)}
                      />
                    ))}
                  </div>
                  {!visible.length && (
                    <div className={styles.state}>
                      <h3>Здесь будет первый отзыв</h3>
                      <p>Пока нет опубликованных оценок и впечатлений студентов.</p>
                    </div>
                  )}
                  {sorted.length > limit && (
                    <div className={styles.more}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const next = sorted[limit];
                          setLimit((value) => value + 6);
                          if (next) setRequestedReview({ id: next.id });
                        }}
                      >
                        Показать ещё отзывы <Icon icon={ArrowDown} size={16} />
                      </Button>
                    </div>
                  )}
                </section>
                {related.length > 0 && (
                  <section className={styles.panel} aria-labelledby="related-title">
                    <h2 id="related-title">Ещё в группе «{DIRECTIONS[item.direction].label}»</h2>
                    <ul className={styles.related}>
                      {related.map((value) => (
                        <li key={value.id}>
                          <a href={disciplineHref(value.id)}>
                            <span className={styles.relatedDot} />
                            <span>{value.title}</span>
                            <small>
                              <Icon icon={Star} size={12} className={styles.star} />
                              {value.rating?.toLocaleString('ru-RU', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              }) ?? '—'}
                            </small>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
            <div
              className={styles.mobileActions}
              data-visible={heroPassed}
              role="region"
              aria-label="Действия с майнором"
            >
              <IconButton
                icon={Heart}
                variant="secondary"
                className={favorite ? styles.favoriteSelected : undefined}
                label={favorite ? 'Убрать из избранного' : 'В избранное'}
                aria-pressed={favorite}
                disabled={favoriteDisabled}
                onClick={() => void toggleFavorite()}
              />
              <Button href={reviewFormHref(disciplineId)}>
                <Icon icon={Pencil} size={17} />
                Оставить отзыв
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
