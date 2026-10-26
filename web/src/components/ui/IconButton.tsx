import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Icon } from './Icon';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: LucideIcon;
  /** Обязательная подпись: у кнопки нет видимого текста. */
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary';
  size?: 's' | 'm' | 'l';
};

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'm',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[variant], styles[size], className)}
      {...rest}
    >
      <Icon icon={icon} size={size === 's' ? 16 : 20} />
    </button>
  );
}
