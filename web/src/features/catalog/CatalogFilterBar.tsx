import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Check, ChevronDown, Star, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { SearchField } from '../../components/ui/SearchField';
import { cx } from '../../lib/cx';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { disciplineCount, selectDisciplines } from './catalogModel';
import type { CatalogFilters, Discipline } from './catalogTypes';
import styles from './CatalogFilterBar.module.css';

type Selection = Pick<CatalogFilters, 'faculties' | 'minimumRating'>;
type FacultyOption = { name: string; label: string; count: number };
type FilterBarProps = {
  items: readonly Discipline[];
  source: readonly Discipline[];
  filters: CatalogFilters;
  count: number;
  loading: boolean;
  onChange: (update: Partial<CatalogFilters>) => void;
};

const emptySelection: Selection = { faculties: [], minimumRating: 0 };
const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();

function facultyOptions(props: FilterBarProps, selection: Selection): FacultyOption[] {
  const available = selectDisciplines(props.source, {
    ...props.filters,
    ...selection,
    faculties: [],
  });
  const names = new Map(props.items.map((item) => [item.faculty, item.facultyLabel ?? '']));
  return [...names].map(([name, label]) => ({
    name,
    label,
    count: available.filter((item) => item.faculty === name).length,
  }));
}

function RatingControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const name = useId();
  return (
    <div className={styles.ratingSection}>
      <span className={styles.sectionTitle}>Рейтинг</span>
      <div className={styles.ratingGroup} role="radiogroup" aria-label="Минимальный рейтинг">
        <span className={styles.ratingCaption} aria-hidden="true">
          Рейтинг
        </span>
        {[
          { value: 0, label: 'Любой' },
          { value: 4, label: '4+' },
          { value: 4.5, label: '4,5+' },
        ].map((option) => (
          <label className={styles.ratingOption} key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              {option.value > 0 && <Icon icon={Star} size={15} className={styles.star} />}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FacultyList({
  options,
  selected,
  onChange,
}: {
  options: readonly FacultyOption[];
  selected: readonly string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className={styles.facultyList} aria-label="Факультеты">
      <legend className={styles.sectionTitle}>Факультет</legend>
      {!options.length && <p className={styles.noFaculties}>Факультетов не найдено</p>}
      {options.map((option) => (
        <label
          className={cx(
            styles.facultyOption,
            selected.includes(option.name) && styles.facultyChecked,
          )}
          key={option.name}
        >
          <span className={styles.checkbox}>
            <input
              type="checkbox"
              checked={selected.includes(option.name)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, option.name]
                    : selected.filter((name) => name !== option.name),
                )
              }
            />
            <Icon icon={Check} size={14} />
          </span>
          <span className={styles.facultyName}>
            {option.name}
            {option.label && <small> {option.label}</small>}
          </span>
          <span className={styles.facultyCount} aria-label={disciplineCount(option.count)}>
            {option.count}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function SortControl({ filters, onChange }: Pick<FilterBarProps, 'filters' | 'onChange'>) {
  const options = [
    { value: 'reviews', label: 'Больше отзывов' },
    { value: 'rating', label: 'Выше рейтинг' },
    { value: 'title', label: 'По алфавиту' },
  ] as const;
  const selectedOption = options.find((option) => option.value === filters.sort) ?? options[0];
  const selectedIndex = options.findIndex((option) => option.value === selectedOption.value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const entries = useRef<(HTMLButtonElement | null)[]>([]);
  const popupId = useId();

  useEffect(() => {
    if (open) entries.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function navigate(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => {
        if (event.key === 'Home') return 0;
        if (event.key === 'End') return options.length - 1;
        if (!open) return selectedIndex;
        return (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      });
    }
  }

  return (
    <div
      className={styles.sort}
      ref={root}
      onKeyDown={navigate}
      onBlurCapture={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
          setOpen(false);
      }}
    >
      <button
        type="button"
        ref={trigger}
        className={styles.sortTrigger}
        aria-label={`Сортировка: ${selectedOption.label.toLocaleLowerCase('ru-RU')}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => {
          setActive(selectedIndex);
          setOpen(!open);
        }}
      >
        <span className={styles.sortCaption}>Сначала:</span>
        <span className={styles.sortValue}>{selectedOption.label}</span>
        <Icon icon={ChevronDown} size={16} className={styles.sortChevron} />
      </button>
      {open && (
        <div className={styles.sortPopup} role="listbox" aria-label="Сортировка" id={popupId}>
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={filters.sort === option.value}
              className={styles.sortOption}
              tabIndex={active === index ? 0 : -1}
              ref={(element) => {
                entries.current[index] = element;
              }}
              onFocus={() => setActive(index)}
              onClick={() => {
                onChange({ sort: option.value });
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              {option.label}
              {filters.sort === option.value && <Icon icon={Check} size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DesktopFilters(props: FilterBarProps) {
  const { filters, onChange } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popupId = useId();
  const options = facultyOptions(props, filters);
  const selectedLabels = filters.faculties.map(
    (name) => options.find((option) => option.name === name)?.label || name,
  );
  const active = filters.faculties.length > 0 || filters.minimumRating > 0;

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className={styles.bar}>
      <div
        className={styles.facultyPicker}
        ref={root}
        onBlurCapture={(event) => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <div className={cx(styles.facultyPill, filters.faculties.length > 0 && styles.activePill)}>
          <button
            type="button"
            ref={trigger}
            className={styles.facultyTrigger}
            aria-label="Выбрать факультеты"
            aria-expanded={open}
            aria-controls={popupId}
            onClick={() => {
              setQuery('');
              setOpen(!open);
            }}
          >
            <span title={selectedLabels.join(', ')}>
              {selectedLabels.join(', ') || 'Факультет'}
            </span>
            {!filters.faculties.length && <Icon icon={ChevronDown} size={16} />}
          </button>
          {filters.faculties.length > 0 && (
            <button
              type="button"
              className={styles.clearFaculties}
              aria-label="Сбросить факультеты"
              onClick={() => onChange({ faculties: [] })}
            >
              <Icon icon={X} size={14} />
            </button>
          )}
        </div>
        {open && (
          <div
            id={popupId}
            className={styles.facultyPopup}
            role="dialog"
            aria-label="Выбор факультетов"
          >
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Найти факультет"
              autoFocus
              className={styles.facultySearch}
            />
            <FacultyList
              options={options.filter((option) =>
                normalize(`${option.name} ${option.label}`).includes(normalize(query)),
              )}
              selected={filters.faculties}
              onChange={(faculties) => onChange({ faculties })}
            />
          </div>
        )}
      </div>
      <RatingControl
        value={filters.minimumRating}
        onChange={(minimumRating) => onChange({ minimumRating })}
      />
      {active && (
        <button type="button" className={styles.reset} onClick={() => onChange(emptySelection)}>
          Сбросить
        </button>
      )}
      <span className={styles.resultCount} role="status">
        {props.loading ? 'Загружаем список…' : disciplineCount(props.count)}
      </span>
      <SortControl filters={filters} onChange={onChange} />
    </div>
  );
}

function FilterSheet({ props, onClose }: { props: FilterBarProps; onClose: () => void }) {
  const [draft, setDraft] = useState<Selection>(() => ({
    faculties: [...props.filters.faculties],
    minimumRating: props.filters.minimumRating,
  }));
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const count = selectDisciplines(props.source, { ...props.filters, ...draft }).length;

  useEffect(() => {
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (element && !element.open) element.showModal();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className={styles.sheetContent}>
        <span className={styles.sheetHandle} aria-hidden="true" />
        <div className={styles.sheetHeader}>
          <h2 id={headingId}>Фильтры</h2>
          <button type="button" className={styles.reset} onClick={() => setDraft(emptySelection)}>
            Сбросить
          </button>
          <IconButton icon={X} label="Закрыть фильтры" onClick={() => dialog.current?.close()} />
        </div>
        <div className={styles.sheetScroll}>
          <RatingControl
            value={draft.minimumRating}
            onChange={(minimumRating) => setDraft((current) => ({ ...current, minimumRating }))}
          />
          <FacultyList
            options={facultyOptions(props, draft)}
            selected={draft.faculties}
            onChange={(faculties) => setDraft((current) => ({ ...current, faculties }))}
          />
        </div>
        <div className={styles.sheetActions}>
          <Button
            fullWidth
            onClick={() => {
              props.onChange(draft);
              dialog.current?.close();
            }}
          >
            Показать {disciplineCount(count).replace(/дисциплина$/, 'дисциплину')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

function MobileFilters(props: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const activeCount = props.filters.faculties.length + Number(props.filters.minimumRating > 0);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div className={styles.bar}>
      <button
        ref={trigger}
        type="button"
        className={cx(styles.mobileTrigger, activeCount > 0 && styles.activePill)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Фильтры {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </button>
      <SortControl filters={props.filters} onChange={props.onChange} />
      <span className={styles.resultCount} role="status">
        {props.loading ? 'Загружаем список…' : disciplineCount(props.count)}
      </span>
      {open && <FilterSheet props={props} onClose={close} />}
    </div>
  );
}

export function CatalogFilterBar(props: FilterBarProps) {
  const mobile = useMediaQuery('(max-width: 768px)');
  return mobile ? <MobileFilters {...props} /> : <DesktopFilters {...props} />;
}
