import type { LucideIcon, LucideProps } from 'lucide-react';

type IconProps = Omit<LucideProps, 'ref'> & {
  icon: LucideIcon;
  /** Подпись для скринридеров. Без неё иконка декоративная. */
  label?: string;
};

/** Обёртка над Lucide с параметрами дизайн-системы: линия 1.75, скруглённые концы. */
export function Icon({ icon: Glyph, size = 20, strokeWidth = 1.75, label, ...rest }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return <Glyph size={size} strokeWidth={strokeWidth} focusable={false} {...a11y} {...rest} />;
}
