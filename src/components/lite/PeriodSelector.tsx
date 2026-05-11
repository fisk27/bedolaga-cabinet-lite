import { cn } from '@/lib/utils';
import { plural } from '@/utils/plural';
import type { TariffPeriod } from '@/types';

interface PeriodSelectorProps {
  periods: TariffPeriod[];
  selectedDays: number | null;
  onChange: (days: number) => void;
}

function periodLabel(days: number): string {
  if (days === 30) return '1 месяц';
  if (days === 60) return '2 месяца';
  if (days === 90) return '3 месяца';
  if (days === 180) return '6 месяцев';
  if (days === 365) return '1 год';
  return `${days} ${plural(days, ['день', 'дня', 'дней'])}`;
}

export function PeriodSelector({ periods, selectedDays, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((p) => {
        const isSel = selectedDays === p.days;
        return (
          <button
            key={p.days}
            type="button"
            onClick={() => onChange(p.days)}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-2 font-subo text-[14px] font-medium transition-colors',
              isSel
                ? 'border-subo-amber bg-subo-amber text-subo-amberInk'
                : 'border-subo-hairline bg-transparent text-subo-textSoft hover:bg-subo-hairline',
            )}
          >
            {periodLabel(p.days)}
          </button>
        );
      })}
    </div>
  );
}
