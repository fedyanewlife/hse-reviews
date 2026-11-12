import { useEffect } from 'react';
import { LoginPage } from './features/auth/LoginPage';
import { CatalogPage } from './features/catalog/CatalogPage';
import { DisciplinePage } from './features/discipline/DisciplinePage';

export function App() {
  const isCatalog = ['/catalog', '/home'].includes(window.location.pathname.replace(/\/+$/, ''));
  const match = /^\/disciplines\/([^/]+)\/?$/.exec(window.location.pathname);
  const isDiscipline = match !== null;
  let disciplineId = '';
  try {
    disciplineId = decodeURIComponent(match?.[1] ?? '');
  } catch {
    /* Invalid URL is handled as a missing discipline. */
  }
  useEffect(() => {
    if (!isDiscipline && !isCatalog) document.title = 'Вход — ОтзоВышка';
  }, [isCatalog, isDiscipline]);
  return match ? (
    <DisciplinePage key={disciplineId} disciplineId={disciplineId} />
  ) : isCatalog ? (
    <CatalogPage />
  ) : (
    <LoginPage />
  );
}
