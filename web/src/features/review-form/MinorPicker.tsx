import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CatalogDialog } from '../catalog/CatalogDialog';
import { DirectionMark } from '../../components/ui/DirectionMark';
import { Icon } from '../../components/ui/Icon';
import { SearchField } from '../../components/ui/SearchField';
import { selectDisciplines } from '../catalog/catalogModel';
import type { Discipline } from '../catalog/catalogTypes';
import styles from './ReviewFormPage.module.css';

export function MinorPicker({
  items,
  value,
  onChange,
  locked,
  error,
}: {
  items: readonly Discipline[];
  value: string;
  onChange: (value: string) => void;
  locked: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const triggerElement = trigger.current;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      if (triggerElement?.isConnected) triggerElement.focus();
    };
  }, [open]);
  const selected = items.find((item) => item.id === value);
  const filtered = selectDisciplines(items, {
    query,
    direction: 'all',
    faculties: [],
    minimumRating: 0,
    sort: 'title',
  });
  return (
    <>
      <button
        type="button"
        ref={trigger}
        className={styles.minorTrigger}
        onClick={() => {
          setQuery('');
          setOpen(true);
        }}
        disabled={locked}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={!!error}
        aria-describedby={error ? 'minor-error' : undefined}
      >
        {selected ? (
          <span className={styles.selectedMinor}>
            <strong>{selected.title}</strong>
            <DirectionMark direction={selected.direction} size="s" />
            <span>{selected.facultyLabel ?? selected.faculty}</span>
          </span>
        ) : (
          <span>Выбрать майнор</span>
        )}
        {!locked && <Icon icon={ChevronDown} size={20} />}
      </button>
      {error && (
        <p id="minor-error" className={styles.fieldError}>
          {error}
        </p>
      )}
      {open && (
        <CatalogDialog open title="Выбери свой майнор" onClose={() => setOpen(false)}>
          <div className={styles.pickerSearch}>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Название, направление или факультет"
              autoFocus
            />
          </div>
          <ul className={styles.minorList}>
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={item.id === value}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      <DirectionMark direction={item.direction} size="s" />
                      {item.facultyLabel ?? item.faculty}
                    </small>
                  </span>
                  {item.id === value && <Icon icon={Check} size={18} />}
                </button>
              </li>
            ))}
          </ul>
          {!filtered.length && (
            <p className={styles.supporting}>Ничего не нашлось. Попробуй другое название.</p>
          )}
        </CatalogDialog>
      )}
    </>
  );
}
