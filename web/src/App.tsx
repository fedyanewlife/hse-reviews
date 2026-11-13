import { useEffect } from 'react';
import { LoginPage } from './features/auth/LoginPage';
import { CatalogPage } from './features/catalog/CatalogPage';
import { DisciplinePage } from './features/discipline/DisciplinePage';
import { ReviewFormPage } from './features/review-form/ReviewFormPage';

export function App() {
  const isCatalog = ['/catalog', '/home'].includes(window.location.pathname.replace(/\/+$/, ''));
  const match = /^\/disciplines\/([^/]+)\/?$/.exec(window.location.pathname);
  const isDiscipline = match !== null;
  const isReviewForm = /^\/review\/new\/?$/.test(window.location.pathname);
  let disciplineId = '';
  try {
    disciplineId = decodeURIComponent(match?.[1] ?? '');
  } catch {
    /* Invalid URL is handled as a missing discipline. */
  }
  useEffect(() => {
    if (!isDiscipline && !isCatalog && !isReviewForm) document.title = 'Вход — ОтзоВышка';
  }, [isCatalog, isDiscipline, isReviewForm]);
  return isReviewForm ? (
    <ReviewFormPage />
  ) : match ? (
    <DisciplinePage key={disciplineId} disciplineId={disciplineId} />
  ) : isCatalog ? (
    <CatalogPage />
  ) : (
    <LoginPage />
  );
}
