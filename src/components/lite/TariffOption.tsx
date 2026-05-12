import { cn } from '@/lib/utils';
import { plural } from '@/utils/plural';
import type { Tariff } from '@/types';

interface TariffOptionProps {
  tariff: Tariff;
  selected: boolean;
  onSelect: () => void;
  isCurrent?: boolean;
}

function cheapestMonthlyLabel(tariff: Tariff): string {
  if (tariff.is_daily && typeof tariff.daily_price_kopeks === 'number') {
    const rub = Math.round(tariff.daily_price_kopeks / 100);
    return `${rub.toLocaleString('ru-RU')} ₽ / день`;
  }
  if (tariff.periods.length === 0) return '—';
  const cheapest = tariff.periods.reduce((min, p) =>
    p.price_per_month_kopeks < min.price_per_month_kopeks ? p : min,
  );
  return `от ${cheapest.price_per_month_label} / мес`;
}

function trafficLabel(tariff: Tariff): string {
  if (tariff.traffic_limit_label) return tariff.traffic_limit_label;
  if (tariff.is_unlimited_traffic) return 'Безлимит';
  return `${tariff.traffic_limit_gb} GB`;
}

function deviceLabel(count: number): string {
  // Genitive after "до": 1 → "устройства", 2+ → "устройств".
  return `до ${count} ${plural(count, ['устройства', 'устройств', 'устройств'])}`;
}

export function TariffOption({ tariff, selected, onSelect, isCurrent = false }: TariffOptionProps) {
  const purchased = tariff.is_purchased === true;
  const disabled = purchased || !tariff.is_available;
  const cornerLabel = purchased ? 'Уже куплен' : isCurrent ? 'Текущий' : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border px-[18px] py-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px] transition-colors',
        selected ? 'border-subo-canary/[0.35]' : 'border-subo-canary/[0.08]',
        disabled ? 'cursor-not-allowed opacity-50' : !selected && 'cursor-pointer',
      )}
      style={{
        background: selected
          ? 'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.54), transparent 65%), rgba(255,255,255,0.025)'
          : 'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.30), transparent 65%), rgba(255,255,255,0.025)',
      }}
    >
      {cornerLabel && (
        <div className="absolute right-3 top-3 font-subo text-[11px] font-medium uppercase tracking-[0.06em] text-subo-amber">
          {cornerLabel}
        </div>
      )}

      <div className={cn('flex items-start justify-between gap-3', cornerLabel && 'pr-20')}>
        <div className="min-w-0 flex-1">
          <div className="font-subo text-[16px] font-semibold tracking-[-0.01em] text-subo-text">
            {tariff.name}
          </div>
          <div className="mt-0.5 font-subo text-[13px] text-subo-textSoft">
            {trafficLabel(tariff)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-subo text-[13px] font-medium text-subo-text">
            {cheapestMonthlyLabel(tariff)}
          </div>
        </div>
      </div>

      <div className="mt-2 font-subo text-[12px] text-subo-textMute">
        {deviceLabel(tariff.device_limit)}
      </div>
    </button>
  );
}
