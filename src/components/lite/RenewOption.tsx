import { cn } from '@/lib/utils';
import { periodLabel } from '@/utils/periodLabel';
import type { RenewalOption } from '@/types';

interface RenewOptionProps {
  option: RenewalOption;
  selected: boolean;
  canAfford: boolean;
  balanceKopeks: number;
  onSelect: () => void;
}

function formatRub(kopeks: number): string {
  return Math.round(kopeks / 100).toLocaleString('ru-RU');
}

export function RenewOption({
  option,
  selected,
  canAfford,
  balanceKopeks,
  onSelect,
}: RenewOptionProps) {
  const hasDiscount = option.discount_percent > 0;
  const missingKopeks = canAfford ? 0 : option.price_kopeks - balanceKopeks;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border bg-subo-surface px-[18px] py-4 text-left transition-colors',
        selected ? 'border-subo-amber bg-subo-amber/[0.04]' : 'border-subo-hairline',
        !canAfford && 'opacity-70',
        !selected && 'cursor-pointer hover:bg-subo-text/[0.02]',
      )}
    >
      {hasDiscount && (
        <div className="absolute right-3 top-3 rounded-full bg-subo-amber/15 px-2 py-0.5 font-subo text-[11px] font-semibold text-subo-amber">
          −{option.discount_percent}%
        </div>
      )}

      <div className={cn('flex items-center justify-between gap-3', hasDiscount && 'pr-14')}>
        <div className="font-subo text-[16px] font-semibold tracking-[-0.01em] text-subo-text">
          {periodLabel(option.period_days)}
        </div>
        <div className="shrink-0 text-right">
          {hasDiscount && option.original_price_kopeks != null && (
            <div className="font-subo text-[11px] text-subo-textMute line-through">
              {formatRub(option.original_price_kopeks)} ₽
            </div>
          )}
          <div className="font-subo text-[18px] font-semibold text-subo-amber">
            {formatRub(option.price_kopeks)} ₽
          </div>
        </div>
      </div>

      {!canAfford && (
        <div className="mt-2 font-subo text-[12px] text-red-400">
          Не хватает {Math.ceil(missingKopeks / 100).toLocaleString('ru-RU')} ₽ на балансе
        </div>
      )}
    </button>
  );
}
