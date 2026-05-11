import { plural } from './plural';

export function periodLabel(days: number): string {
  if (days === 30) return '1 месяц';
  if (days === 60) return '2 месяца';
  if (days === 90) return '3 месяца';
  if (days === 180) return '6 месяцев';
  if (days === 365) return '1 год';
  return `${days} ${plural(days, ['день', 'дня', 'дней'])}`;
}
