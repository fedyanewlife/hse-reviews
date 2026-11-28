import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import styles from './LoginPage.module.css';

/**
 * Вход для сотрудников сервиса по логину и паролю.
 * Бэкенда для него пока нет: форма проверяет заполненность полей и больше ничего не делает.
 */
export function StaffLoginForm({ id }: { id: string }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextLoginError = login.trim() ? '' : 'Введите логин';
    const nextPasswordError = password ? '' : 'Введите пароль';
    setLoginError(nextLoginError);
    setPasswordError(nextPasswordError);
  };

  return (
    <form id={id} className={styles.staffForm} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Логин"
        name="username"
        autoComplete="username"
        value={login}
        error={loginError}
        onChange={(value) => {
          setLogin(value);
          setLoginError('');
        }}
      />
      <TextField
        label="Пароль"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        error={passwordError}
        onChange={(value) => {
          setPassword(value);
          setPasswordError('');
        }}
      />
      <div className={styles.staffActions}>
        <Button type="submit" variant="secondary" size="m" fullWidth>
          Войти
        </Button>
      </div>
    </form>
  );
}
