import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Icon } from './Icon';
import styles from './SelectMenu.module.css';

export function SelectMenu<T extends string>({
  value,
  onChange,
  options,
  label = 'Сортировка',
  caption = 'Сначала:',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; triggerLabel?: string; icon?: ReactNode }[];
  label?: string;
  caption?: string;
  className?: string;
}) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = options.findIndex((option) => option.value === selectedOption?.value);
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

  if (!selectedOption) return null;
  return (
    <div
      className={cx(styles.sort, className)}
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
        aria-label={`${label}: ${selectedOption.label.toLocaleLowerCase('ru-RU')}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={popupId}
        onClick={() => {
          setActive(selectedIndex);
          setOpen(!open);
        }}
      >
        {caption && <span className={styles.sortCaption}>{caption}</span>}
        {selectedOption.icon}
        <span className={styles.sortValue}>
          {selectedOption.triggerLabel ?? selectedOption.label}
        </span>
        <Icon icon={ChevronDown} size={16} className={styles.sortChevron} />
      </button>
      {open && (
        <div className={styles.sortPopup} role="listbox" aria-label={label} id={popupId}>
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={styles.sortOption}
              tabIndex={active === index ? 0 : -1}
              ref={(element) => {
                entries.current[index] = element;
              }}
              onFocus={() => setActive(index)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <span className={styles.sortOptionLabel}>
                {option.icon}
                {option.label}
              </span>
              {value === option.value && <Icon icon={Check} size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
