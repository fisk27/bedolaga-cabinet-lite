import { plural } from '@/utils/plural';
import { StatusPill } from './StatusPill';
import { PrimaryButton } from './PrimaryButton';
import { GhostButton } from './GhostButton';

interface HeroCardExpiringProps {
  daysLeft: number;
  endDate: string;
  onConnect: () => void;
  onRenew: () => void;
}

export function HeroCardExpiring({ daysLeft, endDate, onConnect, onRenew }: HeroCardExpiringProps) {
  const showTomorrow = daysLeft <= 1;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-subo-amber/[0.15] bg-subo-surface p-[22px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-subo-shimmer rounded-3xl"
        style={{
          background:
            'radial-gradient(120% 80% at 100% 0%, rgba(242, 193, 46, 0.09), transparent 55%)',
        }}
      />
      <div className="relative">
        <StatusPill kind="warn">Скоро истекает</StatusPill>

        <div className="mt-[18px] font-subo text-[14px] tracking-[-0.005em] text-subo-textSoft">
          Истекает
        </div>

        <div className="mt-1 flex items-baseline gap-2.5">
          <div className="font-subo text-[48px] font-semibold leading-none tracking-[-0.04em] text-subo-amber">
            {showTomorrow ? 'Завтра' : daysLeft}
          </div>
          {!showTomorrow && (
            <div className="font-subo text-[20px] font-medium tracking-[-0.02em] text-subo-amber">
              {plural(daysLeft, ['день', 'дня', 'дней'])}
            </div>
          )}
        </div>

        <div className="mt-1.5 font-subo text-[13px] text-subo-textMute">до {endDate}</div>

        <div className="mt-[22px]">
          <PrimaryButton pulse onClick={onRenew}>
            Продлить сейчас
          </PrimaryButton>
        </div>
        <div className="mt-2.5">
          <GhostButton onClick={onConnect}>Подключить устройство</GhostButton>
        </div>
      </div>
    </div>
  );
}
