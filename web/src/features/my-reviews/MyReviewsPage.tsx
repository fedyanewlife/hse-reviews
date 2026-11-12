import { ArrowRight, Check, FileText, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import type { Discipline, UserReview } from '../catalog/catalogTypes';
import { personalReviewState, REVIEW_STATES } from './myReviewModel';
import { OwnReviewCard, ReviewStars } from './OwnReviewCard';
import styles from './MyReviewsPage.module.css';

type Props = {
  reviews: readonly UserReview[];
  status: 'loading' | 'ready' | 'error';
  error: unknown;
  onRetry: () => void;
  items: readonly Discipline[];
  catalogStatus: 'loading' | 'ready' | 'error';
  onCatalogRetry: () => void;
  preview?: UserReview | null;
};

export function MyReviewsPage({
  reviews,
  status,
  error,
  onRetry,
  items,
  catalogStatus,
  onCatalogRetry,
  preview,
}: Props) {
  // An explicit demo preview never masks loading, API errors or saved user data.
  const isPreview = status === 'ready' && reviews.length === 0 && !!preview;
  const { current, history } = personalReviewState(
    status === 'ready' ? (isPreview ? [preview!] : reviews) : [],
  );
  const discipline = items.find((item) => item.id === current?.disciplineId);
  const state = current ? REVIEW_STATES[current.status] : null;
  const quote = current?.experience.trim() || current?.advice.trim();
  return (
    <>
      <section className={styles.hero} aria-labelledby="my-reviews-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{state?.eyebrow ?? 'Твой опыт кому-то поможет'}</p>
          <h1 id="my-reviews-title">Мои отзывы</h1>
          {current ? (
            <a href="#my-current-review" className={styles.heroLink}>
              Посмотреть свой отзыв <Icon icon={ArrowRight} size={16} />
            </a>
          ) : status === 'ready' ? (
            <button type="button" className={styles.heroLink}>
              Рассказать о своём майноре <Icon icon={ArrowRight} size={16} />
            </button>
          ) : (
            <p className={styles.heroHint}>Твои оценки и впечатления о майноре</p>
          )}
        </div>
        <div className={styles.previewArea}>
          {current ? (
            <>
              <div className={styles.previewCard}>
                <p className={styles.previewCourse}>
                  Твой отзыв{discipline ? ` · ${discipline.title}` : ''}
                </p>
                <ReviewStars value={current.ratings.recommendation} />
                <p className={styles.previewText}>
                  {quote || 'Ты оценил майнор по пяти критериям.'}
                </p>
              </div>
              {current.status === 'published' &&
                current.helpfulCount != null &&
                current.helpfulCount > 0 && (
                  <span className={styles.helpful}>
                    <Icon icon={Check} size={16} />
                    Отметок «Полезно»: {current.helpfulCount}
                  </span>
                )}
            </>
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <Icon icon={FileText} size={22} />
              <p>
                {status === 'loading'
                  ? 'Загружаем твой отзыв'
                  : status === 'error'
                    ? 'Твой отзыв будет здесь'
                    : 'Здесь появится твой отзыв'}
              </p>
              <span />
              <span />
            </div>
          )}
        </div>
      </section>
      {isPreview && (
        <p className={styles.previewNotice}>
          Пример состояния. Это демонстрационный отзыв, он не сохранён в твоём аккаунте.
        </p>
      )}
      <section
        className={styles.content}
        aria-label="Твой отзыв о майноре"
        aria-busy={status === 'loading'}
      >
        {status === 'loading' ? (
          <div className={styles.loading} role="status">
            <p>Загружаем твой отзыв…</p>
            <div className={styles.loadingLine} />
            <div className={styles.loadingLine} />
          </div>
        ) : status === 'error' ? (
          <div className={styles.empty} role="alert">
            <h2>
              {isUnauthorized(error)
                ? 'Войди, чтобы увидеть свой отзыв'
                : 'Не удалось загрузить твой отзыв'}
            </h2>
            <p>{errorMessage(error)}</p>
            {isUnauthorized(error) ? (
              <Button href="/" variant="secondary">
                Войти
              </Button>
            ) : (
              <Button variant="secondary" onClick={onRetry}>
                Повторить загрузку
              </Button>
            )}
          </div>
        ) : current && state ? (
          <>
            {catalogStatus === 'error' && (
              <div className={styles.catalogError} role="status">
                <span>Название майнора не загрузилось. Текст и оценки твоего отзыва доступны.</span>
                <Button size="s" variant="ghost" onClick={onCatalogRetry}>
                  Повторить
                </Button>
              </div>
            )}
            <div className={styles.layout}>
              <div className={styles.reviewColumn}>
                <OwnReviewCard review={current} discipline={discipline} current />
                {!!history.length && (
                  <details className={styles.history}>
                    <summary>
                      История отправок <span>{history.length}</span>
                    </summary>
                    <div>
                      {history.map((review) => (
                        <OwnReviewCard
                          key={review.id}
                          review={review}
                          discipline={items.find((item) => item.id === review.disciplineId)}
                        />
                      ))}
                    </div>
                  </details>
                )}
              </div>
              <aside className={styles.sideNote} aria-label="О твоём отзыве">
                <span className={styles.status} data-status={current.status}>
                  {state.label}
                </span>
                <h2>{state.heading}</h2>
                <p>{state.description}</p>
                {current.status === 'rejected' && current.moderationNote?.trim() && (
                  <div className={styles.moderation}>
                    <strong>Комментарий модератора</strong>
                    <p>{current.moderationNote}</p>
                  </div>
                )}
                <div className={styles.oneMinor}>
                  <Icon icon={ShieldCheck} size={19} />
                  <p>
                    Один пользователь — один майнор. Все твои оценки и впечатления собраны в одном
                    отзыве.
                  </p>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <Icon icon={Pencil} size={24} className={styles.emptyIcon} />
            <h2>Как тебе твой майнор?</h2>
            <p>
              Расскажи о сложности, нагрузке, интересе и пользе. Твой отзыв поможет другим студентам
              сделать выбор.
            </p>
            <Button>
              Оставить отзыв <Icon icon={ArrowRight} size={16} />
            </Button>
            <span className={styles.emptyHint}>Можно оставить отзыв только об одном майноре.</span>
          </div>
        )}
      </section>
    </>
  );
}
