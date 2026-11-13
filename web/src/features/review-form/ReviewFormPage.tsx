import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { CatalogHeader } from '../catalog/CatalogHeader';
import { isDemoCatalog } from '../catalog/catalogRepository';
import { useCatalog } from '../catalog/useCatalog';
import { useCatalogAccount } from '../catalog/useCatalogAccount';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { disciplineHref } from '../discipline/disciplineModel';
import { personalReviewState } from '../my-reviews/myReviewModel';
import type { ReviewInput, UserReview } from '../catalog/catalogTypes';
import { ReviewForm } from './ReviewForm';
import shell from '../catalog/CatalogPage.module.css';
import styles from './ReviewFormPage.module.css';

export function ReviewFormPage() {
  const catalog = useCatalog(null);
  const account = useCatalogAccount();
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState<UserReview | null>(null);
  const requested = new URLSearchParams(window.location.search).get('minor');
  const { current } = personalReviewState(account.reviews);
  const blocked =
    account.reviews.some((review) => review.status !== 'rejected') ||
    new Set(account.reviews.map((review) => review.disciplineId)).size > 1;
  const backItem = catalog.items.find(
    (item) => item.id === (saved?.disciplineId ?? current?.disciplineId ?? requested),
  );
  const error = account.reviewsStatus === 'error' ? account.reviewsError : catalog.error;
  const failed = account.reviewsStatus === 'error' || catalog.status === 'error';
  const loading = account.reviewsStatus === 'loading' || catalog.status === 'loading';
  useEffect(() => {
    document.title = `${saved ? (saved.status === 'local' ? 'Отзыв сохранён' : 'Отзыв отправлен') : 'Новый отзыв'} — ОтзоВышка`;
  }, [saved]);
  async function save(input: ReviewInput) {
    const review = await account.createReview(input);
    setSaved(review);
  }
  return (
    <div className={shell.page}>
      <a href="#main-content" className={shell.skipLink}>
        К содержимому
      </a>
      <CatalogHeader onError={setNotice} />
      <main id="main-content" className={`${shell.main} ${styles.main}`}>
        <a className={styles.back} href={backItem ? disciplineHref(backItem.id) : '/catalog'}>
          <Icon icon={ArrowLeft} size={17} />
          {backItem?.title ?? 'К списку дисциплин'}
        </a>
        {notice && (
          <p className={shell.notice} role="status">
            {notice}
          </p>
        )}
        {saved ? (
          <section
            className={styles.result}
            aria-labelledby="result-title"
            tabIndex={-1}
            ref={(element) => {
              element?.focus();
            }}
          >
            <Icon icon={Check} size={32} className={styles.resultIcon} />
            <h1 id="result-title">
              {saved.status === 'local'
                ? 'Спасибо! Отзыв сохранён'
                : saved.status === 'published'
                  ? 'Спасибо! Отзыв опубликован'
                  : saved.status === 'rejected'
                    ? 'Отзыв сохранён, но не опубликован'
                    : 'Спасибо! Отзыв на проверке'}
            </h1>
            <p>
              {saved.status === 'local'
                ? 'В демо отзыв хранится только в этом браузере. Ты можешь увидеть его в разделе «Мои отзывы».'
                : saved.status === 'published'
                  ? 'Твой отзыв доступен студентам на странице майнора. Имя и почта не показываются.'
                  : 'Статус доступен в разделе «Мои отзывы». После одобрения отзыв появится на странице майнора.'}
            </p>
            <div className={styles.resultActions}>
              <Button href="/catalog?view=reviews" variant="secondary">
                Мои отзывы
              </Button>
              <Button href={disciplineHref(saved.disciplineId)}>К странице майнора</Button>
            </div>
          </section>
        ) : loading ? (
          <div className={styles.pageState} role="status">
            <h1>Новый отзыв</h1>
            <p>Загружаем майноры и проверяем твои отзывы…</p>
          </div>
        ) : account.reviewsStatus === 'error' ? (
          <div className={styles.pageState} role="alert">
            <h1>
              {isUnauthorized(error)
                ? 'Войди, чтобы оставить отзыв'
                : 'Не удалось загрузить твои отзывы'}
            </h1>
            <p>{errorMessage(error)}</p>
            {isUnauthorized(error) ? (
              <Button href="/">Войти</Button>
            ) : (
              <Button onClick={account.retry}>Повторить</Button>
            )}
          </div>
        ) : blocked ? (
          <div className={styles.result}>
            <Icon icon={ShieldCheck} size={32} className={styles.resultIcon} />
            <h1>Твой отзыв уже есть</h1>
            <p>
              Можно оставить отзыв только об одном майноре. Посмотри свой текст, оценки и статус в
              разделе «Мои отзывы».
            </p>
            <Button href="/catalog?view=reviews">Посмотреть свой отзыв</Button>
          </div>
        ) : failed ? (
          <div className={styles.pageState} role="alert">
            <h1>Не удалось загрузить майноры</h1>
            <p>{errorMessage(error)}</p>
            <Button onClick={catalog.retry}>Повторить</Button>
          </div>
        ) : current && !catalog.items.some((item) => item.id === current.disciplineId) ? (
          <div className={styles.pageState}>
            <h1>Майнор пока недоступен</h1>
            <p>
              Майнор из твоего отзыва отсутствует в каталоге. Текст и оценки доступны в разделе «Мои
              отзывы».
            </p>
            <Button href="/catalog?view=reviews">Мои отзывы</Button>
          </div>
        ) : !catalog.items.length ? (
          <div className={styles.pageState}>
            <h1>Майноров пока нет</h1>
            <p>Оставить отзыв можно будет, когда появится список майноров.</p>
            <Button href="/catalog" variant="secondary">
              К списку дисциплин
            </Button>
          </div>
        ) : (
          <>
            <header className={styles.intro}>
              <h1>{current ? 'Повторная отправка отзыва' : 'Новый отзыв'}</h1>
              <p>Расскажи о своём опыте — следующему потоку будет проще выбрать майнор.</p>
            </header>
            <ReviewForm
              items={catalog.items}
              selectedId={requested}
              previous={current}
              demo={isDemoCatalog}
              onSave={save}
            />
          </>
        )}
      </main>
    </div>
  );
}
