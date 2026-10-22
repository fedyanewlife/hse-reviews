import type { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Icon } from './Icon';
import styles from './SearchField.module.css';

type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
  value: string;
  onChange?: (value: string) => void;
  size?: 'm' | 'l';
  className?: string;
};

export function SearchField({
  value,
  onChange,
  size = 'm',
  placeholder = 'Майнор, дисциплина или преподаватель',
  readOnly,
  className,
  ...rest
}: SearchFieldProps) {
  return (
    <div className={cx(styles.wrapper, styles[size], className)}>
      <Icon icon={Search} size={size === 'l' ? 22 : 20} className={styles.searchIcon} />
      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      />
      {value && !readOnly && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Очистить"
          onClick={() => onChange?.('')}
        >
          <Icon icon={X} size={18} />
        </button>
      )}
    </div>
  );
}
