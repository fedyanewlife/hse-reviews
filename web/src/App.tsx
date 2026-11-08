import { useEffect } from 'react';
import { LoginPage } from './features/auth/LoginPage';
import { CatalogPage } from './features/catalog/CatalogPage';

export function App() {
  const isCatalog = ['/catalog', '/home'].includes(window.location.pathname.replace(/\/+$/, ''));
  useEffect(() => {
    document.title = `${isCatalog ? 'Дисциплины' : 'Вход'} — ОтзоВышка`;
  }, [isCatalog]);
  return isCatalog ? <CatalogPage /> : <LoginPage />;
}
