import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { errorMessage, isUnauthorized } from '../../shared/api/client';
import { METRIC_CRITERIA } from '../discipline/disciplineTypes';
import type { Discipline, ReviewInput } from '../catalog/catalogTypes';
import { MinorPicker } from './MinorPicker';
import { RatingInput } from './RatingInput';
import { ReviewPreview } from './ReviewPreview';
import {
  completedAnswers,
  completionOptions,
  initialDraft,
  restoreDraft,
  reviewInput,
  reviewDraftStorageKey,
  validateReviewDraft,
  TEXT_LIMIT,
  REQUIRED_ANSWERS,
  type ReviewDraft,
} from './reviewFormModel';
import styles from './ReviewFormPage.module.css';

function readDraft(key: string) {
  try {
    return restoreDraft(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}
export function ReviewForm({
  items,
  selectedId,
  demo,
  onSave,
}: {
  items: readonly Discipline[];
  selectedId: string | null;
  demo: boolean;
  onSave: (input: ReviewInput) => Promise<void>;
}) {
  const draftKey = reviewDraftStorageKey(demo);
  const [draft, setDraft] = useState(() => initialDraft(items, selectedId, readDraft(draftKey)));
  const [tried, setTried] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const submitting = useRef(false);
  const options = completionOptions();
  const errors = validateReviewDraft(draft, items, options);
  const answered = completedAnswers(draft, items, options);
  const completion = options.find((value) => value.value === draft.completion)?.label;
  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ ...draft, consent: false }));
    } catch {
      /* The form remains usable without browser storage. */
    }
  }, [draft, draftKey]);

  function update(patch: Partial<ReviewDraft>) {
    setDraft((value) => ({ ...value, ...patch }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setTried(true);
    if (Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      event.currentTarget
        .querySelector<HTMLElement>(
          `[data-field="${first}"] input, [data-field="${first}"] button, [data-field="${first}"] textarea`,
        )
        ?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    setFailure(null);
    try {
      await onSave(reviewInput(draft));
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        /* Successful submission does not depend on draft cleanup. */
      }
    } catch (error) {
      setFailure(error);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-busy={pending} className={styles.form}>
      <div className={styles.progressRow}>
        <progress
          value={answered}
          max={REQUIRED_ANSWERS}
          aria-label="Заполнение обязательных полей"
        />
        <span>
          {answered} из {REQUIRED_ANSWERS} обязательных ответов
        </span>
      </div>
      <fieldset className={styles.formFields} disabled={pending}>
        <legend className={styles.srOnly}>Новый отзыв о майноре</legend>
        <section
          className={styles.section}
          aria-labelledby="minor-heading"
          data-field="disciplineId"
        >
          <h2 id="minor-heading">Майнор</h2>
          <MinorPicker
            items={items}
            value={draft.disciplineId}
            onChange={(disciplineId) => update({ disciplineId })}
            error={tried ? errors.disciplineId : undefined}
          />
        </section>
        <section
          className={styles.section}
          aria-labelledby="completion-heading"
          data-field="completion"
        >
          <h2 id="completion-heading">Когда проходил</h2>
          <div
            className={styles.completionOptions}
            role="radiogroup"
            aria-labelledby="completion-heading"
            aria-invalid={tried && !!errors.completion}
            aria-describedby={tried && errors.completion ? 'completion-error' : undefined}
          >
            {options.map((option) => (
              <label key={option.value} className={styles.pillOption}>
                <input
                  type="radio"
                  required
                  name="completion"
                  value={option.value}
                  checked={draft.completion === option.value}
                  onChange={() => update({ completion: option.value })}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {tried && errors.completion && (
            <p className={styles.fieldError} id="completion-error">
              {errors.completion}
            </p>
          )}
        </section>
        <section className={styles.section} aria-labelledby="ratings-heading">
          <div className={styles.ratingsHeading}>
            <h2 id="ratings-heading">Оцени по четырём критериям</h2>
            <p id="criteria-scale">1 — минимум, 5 — максимум</p>
          </div>
          <div className={styles.criteriaGrid}>
            {METRIC_CRITERIA.map(({ key, label }) => (
              <div key={key} data-field={key}>
                <RatingInput
                  name={key}
                  label={label}
                  descriptionId="criteria-scale"
                  value={draft.ratings[key]}
                  onChange={(value) => update({ ratings: { ...draft.ratings, [key]: value } })}
                  error={tried ? errors[key] : undefined}
                />
              </div>
            ))}
          </div>
        </section>
        <section
          className={styles.section}
          aria-labelledby="recommendation-heading"
          data-field="recommendation"
        >
          <h2 id="recommendation-heading">Порекомендовал бы этот майнор?</h2>
          <p className={styles.recommendationNote} id="recommendation-note">
            Эта оценка влияет на рейтинг майнора.
          </p>
          <RatingInput
            stars
            name="recommendation"
            label="Твоя рекомендация"
            descriptionId="recommendation-note"
            value={draft.ratings.recommendation}
            onChange={(value) => update({ ratings: { ...draft.ratings, recommendation: value } })}
            error={tried ? errors.recommendation : undefined}
          />
        </section>
        <section
          className={styles.section}
          aria-labelledby="experience-heading"
          data-field="experience"
        >
          <h2 id="experience-heading">
            Расскажи подробнее <span>Необязательно</span>
          </h2>
          <textarea
            name="experience"
            aria-labelledby="experience-heading"
            aria-describedby={`experience-count${tried && errors.experience ? ' experience-error' : ''}`}
            aria-invalid={tried && !!errors.experience}
            value={draft.experience}
            onChange={(event) => update({ experience: event.target.value })}
            maxLength={TEXT_LIMIT}
            rows={6}
            placeholder="Что понравилось в занятиях и что можно улучшить?"
          />
          <p className={styles.counter} id="experience-count">
            {draft.experience.length} / {TEXT_LIMIT}
          </p>
          {tried && errors.experience && (
            <p className={styles.fieldError} id="experience-error">
              {errors.experience}
            </p>
          )}
        </section>
        <section className={styles.section} aria-labelledby="advice-heading" data-field="advice">
          <h2 id="advice-heading">
            Что стоит знать перед выбором <span>Необязательно</span>
          </h2>
          <textarea
            name="advice"
            aria-labelledby="advice-heading"
            aria-describedby={`advice-count${tried && errors.advice ? ' advice-error' : ''}`}
            aria-invalid={tried && !!errors.advice}
            value={draft.advice}
            onChange={(event) => update({ advice: event.target.value })}
            maxLength={TEXT_LIMIT}
            rows={4}
            placeholder="Например, на семинарах важна активность"
          />
          <p className={styles.counter} id="advice-count">
            {draft.advice.length} / {TEXT_LIMIT}
          </p>
          {tried && errors.advice && (
            <p className={styles.fieldError} id="advice-error">
              {errors.advice}
            </p>
          )}
        </section>
        <ReviewPreview draft={draft} completion={completion} />
        <div className={styles.consent} data-field="consent">
          <label>
            <input
              type="checkbox"
              required
              name="consent"
              checked={draft.consent}
              onChange={(event) => update({ consent: event.target.checked })}
              aria-invalid={tried && !!errors.consent}
              aria-describedby={tried && errors.consent ? 'consent-error' : undefined}
            />
            <span>Согласен на публикацию отзыва в анонимном виде после проверки</span>
          </label>
          {tried && errors.consent && (
            <p className={styles.fieldError} id="consent-error">
              {errors.consent}
            </p>
          )}
          {!demo && (
            <p className={styles.privacy}>
              <Icon icon={ShieldCheck} size={21} />
              <span>
                После проверки отзыв появится на странице майнора без имени и почты. Аккаунт нужен
                для проверки лимита отправок.
              </span>
            </p>
          )}
        </div>
      </fieldset>
      {tried && Object.keys(errors).length > 0 && (
        <p className={styles.validationMessage} role="alert">
          Проверь отмеченные поля. Все пять оценок, майнор, статус прохождения и согласие
          обязательны.
        </p>
      )}
      {failure !== null && (
        <div className={styles.failure} role="alert">
          <p>{errorMessage(failure)}</p>
          <p>Твои ответы остались в форме.</p>
          {isUnauthorized(failure) ? (
            <Button href="/" variant="secondary">
              Войти
            </Button>
          ) : null}
        </div>
      )}
      <div className={styles.submitBar}>
        <p>
          {pending
            ? 'Сохраняем твой отзыв…'
            : answered === REQUIRED_ANSWERS
              ? 'Все обязательные ответы заполнены'
              : `Осталось заполнить: ${REQUIRED_ANSWERS - answered}`}
        </p>
        <Button type="submit" size="l" disabled={pending}>
          {pending ? 'Сохраняем…' : 'Отправить отзыв'}
        </Button>
      </div>
    </form>
  );
}
