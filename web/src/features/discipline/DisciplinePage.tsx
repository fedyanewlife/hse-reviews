import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, Heart, Lightbulb, Pencil, Star } from 'lucide-react';
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
import {
  adviceReviews,
  completionLabel,
  disciplineHref,
  reviewSummary,
  selectReviews,
} from './disciplineModel';
import { DisciplineRatings } from './DisciplineRatings';
import { DisciplineReviewCard } from './DisciplineReviewCard';
import type { ReviewAudience, ReviewSort } from './disciplineTypes';
import { useHelpfulVotes } from './useHelpfulVotes';
import styles from './DisciplinePage.module.css';

export function DisciplinePage({ disciplineId }: { disciplineId: string }) {
  const catalog = useCatalog(null);
  const item = catalog.items.find((value) => value.id === disciplineId);
  const data = useDisciplineReviews(item?.id ?? null);
  const account = useCatalogAccount();
  const [notice, setNotice] = useState('');
  const [audience, setAudience] = useState<ReviewAudience>('all');
  const [sort, setSort] = useState<ReviewSort>('helpful');
  const [limit, setLimit] = useState(6);
  const [requestedReview, setRequestedReview] = useState<string | null>(null);
  const voting = useHelpfulVotes(isDemoCatalog, setNotice);
  const summary = reviewSummary(data.items);
  const hasHelpful = data.items.some((review) => review.helpfulCount !== null);
  const effectiveSort = !hasHelpful && sort === 'helpful' ? 'newest' : sort;
  const sorted = selectReviews(data.items, audience, effectiveSort, voting.votes);
  const visible = sorted.slice(0, limit);
  const hints = adviceReviews(data.items);
  const quotes = data.items.filter((review) => review.experience.trim()).slice(0, 2);
  const related = catalog.items
    .filter((value) => value.id !== item?.id && value.direction === item?.direction)
    .slice(0, 3);
  const favorite = account.favorites.includes(disciplineId);
  const favoriteDisabled = account.status !== 'ready' || account.pendingIds.includes(disciplineId);

  useEffect(() => {
    document.title = `${item?.title ?? 'Майнор'} — ОтзоВышка`;
  }, [item?.title]);
  useEffect(() => {
    if (!requestedReview) return;
    const element = document.getElementById(`review-${requestedReview}`);
    element?.scrollIntoView({ block: 'start' });
    element?.focus({ preventScroll: true });
    setRequestedReview(null);
  }, [requestedReview]);

  async function toggleFavorite() {
    try {
      await account.toggleFavorite(disciplineId);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }
  function revealReview(id: string) {
    setAudience('all');
    const index = selectReviews(data.items, 'all', effectiveSort, voting.votes).findIndex(
      (review) => review.id === id,
    );
    setLimit(Math.max(6, index + 1));
    setRequestedReview(id);
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
          <a href="/catalog">Дисциплины</a>
          <span aria-hidden="true">/</span>
          <span>{item ? DIRECTIONS[item.direction].label : 'Майнор'}</span>
          {isDemoCatalog && <span className={styles.demo}>Демо</span>}
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
            <p>Возможно, ссылка устарела. Найдите нужную дисциплину в каталоге.</p>
            <Button href="/catalog">Перейти в каталог</Button>
          </section>
        ) : (
          <>
            <section
              className={styles.hero}
              aria-labelledby="discipline-title"
              data-has-quotes={quotes.length > 0}
            >
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
                  <div>
                    <a href="#reviews">
                      {data.status === 'ready' ? reviewCount(summary.count) : 'Загружаем отзывы…'}
                    </a>
                    {data.status === 'ready' && (
                      <small>
                        {summary.recommendedPercent === null
                          ? 'Оценок пока нет'
                          : `${summary.recommendedPercent}% рекомендуют · оценки 4–5`}
                      </small>
                    )}
                  </div>
                </div>
                <div className={styles.heroActions}>
                  <Button
                    onClick={() => void toggleFavorite()}
                    disabled={favoriteDisabled}
                    aria-pressed={favorite}
                    className={cx(styles.favoriteButton, favorite && styles.favoriteSelected)}
                  >
                    <Icon icon={Heart} size={18} />
                    {favorite ? 'В избранном' : 'В избранное'}
                  </Button>
                  <Button href="#reviews" variant="secondary">
                    Читать отзывы <Icon icon={ArrowDown} size={16} />
                  </Button>
                </div>
              </div>
              {quotes.length > 0 && (
                <div className={styles.heroQuotes} aria-label="Из отзывов о майноре">
                  {quotes.map((review) => (
                    <blockquote key={review.id}>
                      <p>
                        {review.experience.length > 140
                          ? `${review.experience.slice(0, 140).trim()}…`
                          : review.experience}
                      </p>
                      <cite>{completionLabel(review)}</cite>
                    </blockquote>
                  ))}
                </div>
              )}
            </section>
            {account.status === 'error' && (
              <div className={styles.notice} role="alert">
                <p>Избранное недоступно. {errorMessage(account.error)}</p>
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
                <div className={styles.primary}>
                  <DisciplineRatings reviews={data.items} />
                  {hints.length > 0 && (
                    <section className={styles.panel} aria-labelledby="advice-title">
                      <h2 id="advice-title">Что знать заранее</h2>
                      <p className={styles.supporting}>
                        Из ответов студентов на вопрос «Что хотелось бы знать перед выбором»
                      </p>
                      <div className={styles.adviceGrid}>
                        {hints.map((review) => (
                          <div className={styles.adviceCard} key={review.id}>
                            <Icon icon={Lightbulb} size={20} />
                            <div>
                              <p>
                                {review.advice.length > 230
                                  ? `${review.advice.slice(0, 230).trim()}…`
                                  : review.advice}
                              </p>
                              <button
                                type="button"
                                className={styles.textButton}
                                onClick={() => revealReview(review.id)}
                              >
                                Читать отзыв <Icon icon={ArrowRight} size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  <section className={styles.reviews} id="reviews" aria-labelledby="reviews-title">
                    <div className={styles.reviewsToolbar}>
                      <div className={styles.sectionHeading}>
                        <h2 id="reviews-title">Отзывы</h2>
                        <span>{summary.count}</span>
                      </div>
                      <div className={styles.audiences} role="group" aria-label="Кто оставил отзыв">
                        {(
                          [
                            { value: 'all', label: 'Все', count: summary.count },
                            { value: 'completed', label: 'Прошли', count: summary.completed },
                            { value: 'studying', label: 'На курсе', count: summary.studying },
                          ] as const
                        ).map((option) => (
                          <button
                            type="button"
                            key={option.value}
                            className={cx(
                              styles.audience,
                              audience === option.value && styles.audienceSelected,
                            )}
                            aria-pressed={audience === option.value}
                            onClick={() => {
                              setAudience(option.value);
                              setLimit(6);
                            }}
                          >
                            {option.label} <span>{option.count}</span>
                          </button>
                        ))}
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
                    {summary.unknown > 0 && (
                      <p className={styles.supporting}>
                        У части отзывов статус прохождения не указан — они доступны во вкладке
                        «Все».
                      </p>
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
                        <h3>
                          {summary.count ? 'Таких отзывов пока нет' : 'Здесь будет первый отзыв'}
                        </h3>
                        <p>
                          {summary.count
                            ? 'Посмотрите все отзывы об этом майноре.'
                            : 'Пока нет опубликованных оценок и впечатлений студентов.'}
                        </p>
                        {summary.count > 0 && (
                          <Button variant="secondary" onClick={() => setAudience('all')}>
                            Все отзывы
                          </Button>
                        )}
                      </div>
                    )}
                    {sorted.length > limit && (
                      <div className={styles.more}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const next = sorted[limit];
                            setLimit((value) => value + 6);
                            if (next) setRequestedReview(next.id);
                          }}
                        >
                          Показать ещё отзывы <Icon icon={ArrowDown} size={16} />
                        </Button>
                      </div>
                    )}
                  </section>
                </div>
                <aside className={styles.sidebar}>
                  <section className={styles.writeCard}>
                    <h2>Проходишь этот майнор?</h2>
                    <p>Расскажи, как было: оценки, нагрузка и что стоит знать заранее.</p>
                    <Button
                      fullWidth
                      className={styles.writeButton}
                      title="Форма отзыва появится позже"
                    >
                      <Icon icon={Pencil} size={17} />
                      Оставить отзыв
                    </Button>
                    <small>Анонимно, после проверки</small>
                  </section>
                  <section className={styles.sidePanel} aria-labelledby="review-authors">
                    <h2 id="review-authors">Кто оставил отзывы</h2>
                    <dl className={styles.authorCounts}>
                      <div>
                        <dt>Прошли майнор</dt>
                        <dd>{summary.completed}</dd>
                      </div>
                      <div>
                        <dt>Сейчас на курсе</dt>
                        <dd>{summary.studying}</dd>
                      </div>
                      {summary.unknown > 0 && (
                        <div>
                          <dt>Не указали статус</dt>
                          <dd>{summary.unknown}</dd>
                        </div>
                      )}
                      {summary.latest && (
                        <div>
                          <dt>Последний отзыв</dt>
                          <dd>
                            {new Intl.DateTimeFormat('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(summary.latest))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>
                  {related.length > 0 && (
                    <section className={styles.sidePanel} aria-labelledby="related-title">
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
                </aside>
              </div>
            )}
            <div className={styles.mobileActions} role="region" aria-label="Действия с майнором">
              <IconButton
                icon={Heart}
                variant="secondary"
                className={cx(styles.mobileFavorite, favorite && styles.favoriteSelected)}
                label={favorite ? 'Убрать из избранного' : 'В избранное'}
                aria-pressed={favorite}
                disabled={favoriteDisabled}
                onClick={() => void toggleFavorite()}
              />
              <Button title="Форма отзыва появится позже">
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
