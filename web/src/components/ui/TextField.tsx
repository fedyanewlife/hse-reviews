import { useId, type InputHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';
import { Icon } from './Icon';
import styles from './TextField.module.css';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string;
  hint?: string;
  error?: string;
  onChange?: (value: string) => void;
};

/** Однострочное поле ввода с подписью, подсказкой и ошибкой. */
export function TextField({ label, hint, error, id, onChange, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const message = error || hint;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <input
        id={fieldId}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      />
      {error ? (
        <span id={messageId} className={styles.error}>
          <Icon icon={CircleAlert} size={16} />
          {error}
        </span>
      ) : hint ? (
        <span id={messageId} className={styles.hint}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
