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
  const wordOnly = daysLeft === 0 ? 'Сегодня' : daysLeft === 1 ? 'Завтра' : null;

  return (
    <div
      className={[
        'subo-hero-glow',
        'relative overflow-hidden rounded-3xl p-[22px]',
        'border border-subo-canary/[0.32]',
        'bg-[radial-gradient(140%_90%_at_100%_0%,rgba(255,215,0,0.18),transparent_55%),linear-gradient(180deg,rgba(28,26,20,0.65)_0%,rgba(20,18,12,0.55)_100%)]',
        'backdrop-blur-[18px]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_24px_70px_-20px_rgba(255,215,0,0.28),0_0_0_1px_rgba(255,215,0,0.08)]',
      ].join(' ')}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-subo-shimmer rounded-3xl"
        style={{
          background:
            'radial-gradient(120% 80% at 100% 0%, rgba(255, 215, 0, 0.18), transparent 55%)',
        }}
      />
      <div className="relative">
        <StatusPill kind="warn">Скоро истекает</StatusPill>

        <div className="mt-[18px] font-subo text-[14px] tracking-[-0.005em] text-subo-textSoft">
          Истекает
        </div>

        <div className="mt-1 flex items-baseline gap-2.5">
          <div className="bg-gradient-to-b from-subo-canaryHi via-subo-canary to-subo-canaryLo bg-clip-text font-subo text-[48px] font-bold leading-none tracking-[-0.045em] text-transparent [font-feature-settings:'tnum'_1,'lnum'_1] [text-shadow:0_0_30px_rgba(255,215,0,0.45)]">
            {wordOnly ?? daysLeft}
          </div>
          {wordOnly === null && (
            <div className="font-subo text-[20px] font-medium tracking-[-0.02em] text-subo-canary">
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
