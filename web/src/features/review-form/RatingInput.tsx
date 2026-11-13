import { Star } from 'lucide-react';
import { Icon } from '../../components/ui/Icon';
import { cx } from '../../lib/cx';
import styles from './ReviewFormPage.module.css';

export function RatingInput({
  name,
  label,
  description,
  low,
  high,
  value,
  onChange,
  error,
  stars = false,
}: {
  name: string;
  label: string;
  description?: string;
  low: string;
  high: string;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
  stars?: boolean;
}) {
  return (
    <fieldset
      className={cx(styles.ratingGroup, stars && styles.starGroup)}
      aria-describedby={`${name}-hint${error ? ` ${name}-error` : ''}`}
      aria-invalid={!!error}
    >
      <legend className={stars ? styles.srOnly : undefined}>
        {label}
        {description && <span>{description}</span>}
      </legend>
      <div className={styles.ratingOptions}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={rating} className={styles.ratingOption}>
            <input
              type="radio"
              required
              name={name}
              value={rating}
              checked={value === rating}
              onChange={() => onChange(rating)}
              aria-label={`${rating} из 5`}
            />
            <span
              className={cx(
                styles.ratingValue,
                value === rating && styles.selected,
                stars && rating <= (value ?? 0) && styles.filledStar,
              )}
            >
              {stars ? <Icon icon={Star} size={30} /> : rating}
            </span>
          </label>
        ))}
      </div>
      <p className={styles.scaleHint} id={`${name}-hint`}>
        <span>1 · {low}</span>
        <span>{high} · 5</span>
      </p>
      {error && (
        <p className={styles.fieldError} id={`${name}-error`}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
