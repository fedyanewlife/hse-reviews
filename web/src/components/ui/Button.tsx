import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

type ButtonOwnProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 's' | 'm' | 'l';
  fullWidth?: boolean;
  children: ReactNode;
};

type AsButton = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & { href?: undefined };

type AsLink = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps> & { href: string };

export type ButtonProps = AsButton | AsLink;

/** Кнопка дизайн-системы. С `href` рендерится ссылкой (для переходов между страницами). */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'm', fullWidth, className, children, ...rest } = props;
  const classes = cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  );

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
