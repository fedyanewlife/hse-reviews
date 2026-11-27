import { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { CatalogHeader } from '../catalog/CatalogHeader';
import { catalogRepository, isDemoCatalog } from '../catalog/catalogRepository';
import { useCatalog } from '../catalog/useCatalog';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { disciplineHref } from '../discipline/disciplineModel';
import type { ReviewInput, ReviewStatus } from '../catalog/catalogTypes';
import { ReviewForm } from './ReviewForm';
import shell from '../catalog/CatalogPage.module.css';
import styles from './ReviewFormPage.module.css';

export function ReviewFormPage() {
  const catalog = useCatalog(null);
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState<ReviewStatus | null>(null);
  const requested = new URLSearchParams(window.location.search).get('minor');
  const backItem = catalog.items.find((item) => item.id === requested);
  useEffect(() => {
    document.title = `${saved ? (saved === 'local' ? 'Отзыв сохранён' : 'Отзыв отправлен') : 'Новый отзыв'} — ОтзоВышка`;
  }, [saved]);
  async function save(input: ReviewInput) {
    setSaved(await catalogRepository.createReview(input));
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
              {saved === 'local'
                ? 'Спасибо! Отзыв сохранён'
                : saved === 'published'
                  ? 'Спасибо! Отзыв опубликован'
                  : saved === 'rejected'
                    ? 'Отзыв сохранён, но не опубликован'
                    : 'Спасибо! Отзыв на проверке'}
            </h1>
            <p>
              {saved === 'local'
                ? 'Демо-отправка завершена. В браузере сохранён только факт отправки.'
                : saved === 'published'
                  ? 'Отзыв опубликован на странице майнора без имени и почты.'
                  : saved === 'rejected'
                    ? 'Отзыв не появится на странице майнора.'
                    : 'После одобрения отзыв появится на странице майнора без имени и почты.'}
            </p>
            <div className={styles.resultActions}>
              <Button href="/catalog">К списку дисциплин</Button>
            </div>
          </section>
        ) : catalog.status === 'loading' ? (
          <div className={styles.pageState} role="status">
            <h1>Новый отзыв</h1>
            <p>Загружаем майноры…</p>
          </div>
        ) : catalog.status === 'error' ? (
          <div className={styles.pageState} role="alert">
            <h1>
              {isUnauthorized(catalog.error)
                ? 'Войди, чтобы оставить отзыв'
                : 'Не удалось загрузить майноры'}
            </h1>
            <p>{errorMessage(catalog.error)}</p>
            {isUnauthorized(catalog.error) ? (
              <Button href="/">Войти</Button>
            ) : (
              <Button onClick={catalog.retry}>Повторить</Button>
            )}
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
              <h1>Новый отзыв</h1>
              <p>Расскажи о своём опыте — следующему потоку будет проще выбрать майнор.</p>
            </header>
            <ReviewForm
              items={catalog.items}
              selectedId={requested}
              demo={isDemoCatalog}
              onSave={save}
            />
          </>
        )}
      </main>
    </div>
  );
}
