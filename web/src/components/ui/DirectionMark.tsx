import type { CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import { DIRECTIONS, type Direction } from './directions';
import styles from './DirectionMark.module.css';

type DirectionMarkProps = {
  direction: Direction;
  label?: string;
  variant?: 'square' | 'tint' | 'line';
  size?: 's' | 'm';
};

/** Цветная метка направления с подписью. */
export function DirectionMark({
  direction,
  label,
  variant = 'square',
  size = 'm',
}: DirectionMarkProps) {
  const dir = DIRECTIONS[direction];
  const style = { '--dir-color': dir.color, '--dir-bg': dir.bg } as CSSProperties;

  return (
    <span className={cx(styles.mark, styles[variant], styles[size])} style={style}>
      <span className={styles.swatch} aria-hidden="true" />
      {label ?? dir.label}
    </span>
  );
}
