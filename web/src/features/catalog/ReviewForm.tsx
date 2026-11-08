import { useId, useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import {
  REVIEW_CRITERIA,
  type Discipline,
  type ReviewInput,
  type ReviewCriterion,
} from './catalogTypes';
import styles from './CatalogPage.module.css';
import { errorMessage } from '../../shared/api/client';

export function ReviewForm({
  items,
  selectedId,
  onSave,
  demo,
}: {
  items: readonly Discipline[];
  selectedId?: string;
  onSave: (review: ReviewInput) => Promise<void>;
  demo: boolean;
}) {
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (pending || !form.reportValidity()) return;
    const data = new FormData(form);
    const ratings = Object.fromEntries(
      REVIEW_CRITERIA.map(({ key }) => [key, Number(data.get(key))]),
    ) as Record<ReviewCriterion, number>;
    setPending(true);
    setError('');
    try {
      await onSave({
        disciplineId: String(data.get('discipline')),
        ratings,
        experience: String(data.get('experience') ?? '').trim(),
        advice: String(data.get('advice') ?? '').trim(),
      });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.reviewForm} onSubmit={submit} aria-busy={pending}>
      <p className={styles.formHint}>
        {demo
          ? 'В демо отзыв сохранится только в этом браузере и не будет опубликован.'
          : 'После отправки отзыв попадёт на проверку. После одобрения он появится без вашего имени.'}
      </p>
      <fieldset className={styles.formFields} disabled={pending}>
        <label className={styles.field}>
          <span>Дисциплина</span>
          <select name="discipline" defaultValue={selectedId ?? ''} required>
            <option value="" disabled>
              Выберите дисциплину
            </option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <fieldset className={styles.ratingFields}>
          <legend>Ваши оценки от 1 до 5</legend>
          {REVIEW_CRITERIA.map(({ key, label }) => (
            <label key={key} className={styles.field}>
              <span>{label}</span>
              <select name={key} defaultValue="" required>
                <option value="" disabled>
                  Выберите
                </option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
        <label className={styles.field} htmlFor={`${id}-experience`}>
          <span>
            Опыт обучения <span className={styles.optional}>(необязательно)</span>
          </span>
          <textarea id={`${id}-experience`} name="experience" rows={3} maxLength={4000} />
        </label>
        <label className={styles.field} htmlFor={`${id}-advice`}>
          <span>
            Совет тем, кто выбирает <span className={styles.optional}>(необязательно)</span>
          </span>
          <textarea id={`${id}-advice`} name="advice" rows={3} maxLength={4000} />
        </label>
        <Button type="submit">
          {pending ? 'Сохраняем…' : demo ? 'Сохранить отзыв' : 'Отправить отзыв'}
        </Button>
      </fieldset>
      {error && (
        <p className={styles.notice} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
