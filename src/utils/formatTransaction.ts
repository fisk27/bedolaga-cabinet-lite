import type { Transaction } from '@/types';

const RUSSIAN_MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export function formatTxAmount(amountKopeks: number, _type?: string): string {
  if (amountKopeks === 0) return '0 ₽';
  const rubles = Math.abs(amountKopeks) / 100;
  const display = rubles.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const sign = amountKopeks > 0 ? '+' : '−';
  return `${sign}${display} ₽`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTxDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return 'Сегодня';
  if (isSameDay(date, yesterday)) return 'Вчера';

  const day = date.getDate();
  const month = RUSSIAN_MONTHS[date.getMonth()];
  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${date.getFullYear()}`;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Пополнение',
  SUBSCRIPTION_PAYMENT: 'Покупка подписки',
  REFERRAL_REWARD: 'Реферальное вознаграждение',
  WITHDRAWAL: 'Списание',
};

export function formatTxDescription(tx: Transaction): string {
  if (tx.description) return tx.description;
  const key = tx.type?.toUpperCase?.() ?? '';
  return TYPE_LABELS[key] ?? 'Операция';
}
