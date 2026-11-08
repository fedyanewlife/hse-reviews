import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../../components/ui/IconButton';
import styles from './CatalogPage.module.css';

export function CatalogDialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = ref.current;
    if (open && !element?.open) element?.showModal();
    else if (!open && element?.open) element.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onClose={onClose}>
      <div className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <IconButton icon={X} label="Закрыть окно" onClick={() => ref.current?.close()} />
      </div>
      {children}
    </dialog>
  );
}
