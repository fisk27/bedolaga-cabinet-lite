import { plural } from '@/utils/plural';
import { StatusPill } from './StatusPill';
import { PrimaryButton } from './PrimaryButton';
import { GhostButton } from './GhostButton';

interface HeroCardActiveProps {
  daysLeft: number;
  endDate: string;
  onConnect: () => void;
  onRenew: () => void;
}

export function HeroCardActive({ daysLeft, endDate, onConnect, onRenew }: HeroCardActiveProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl p-[22px]',
        'border border-subo-canary/[0.18]',
        'bg-[radial-gradient(140%_90%_at_100%_0%,rgba(255,215,0,0.14),transparent_55%),radial-gradient(120%_90%_at_0%_100%,rgba(255,215,0,0.06),transparent_60%),linear-gradient(180deg,rgba(28,26,20,0.65)_0%,rgba(20,18,12,0.55)_100%)]',
        'backdrop-blur-[18px]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_20px_60px_-20px_rgba(255,215,0,0.20),0_0_0_1px_rgba(255,215,0,0.05)]',
      ].join(' ')}
    >
      <div className="relative">
        <div className="flex justify-center">
          <StatusPill kind="active">Подписка активна</StatusPill>
        </div>

        <div className="mt-[18px] font-subo text-[14px] tracking-[-0.005em] text-subo-textSoft">
          Осталось
        </div>

        <div className="mt-1 flex items-baseline gap-2.5">
          <div className="font-subo text-[48px] font-bold leading-none tracking-[-0.045em] text-subo-textSoft [font-feature-settings:'tnum'_1,'lnum'_1]">
            {daysLeft}
          </div>
          <div className="font-subo text-[20px] font-medium tracking-[-0.02em] text-subo-textSoft">
            {plural(daysLeft, ['день', 'дня', 'дней'])}
          </div>
        </div>

        <div className="mt-1.5 font-subo text-[13px] text-subo-textMute">до {endDate}</div>

        <div className="mt-[22px]">
          <PrimaryButton onClick={onConnect}>Подключить устройство</PrimaryButton>
        </div>
        <div className="mt-2.5">
          <GhostButton onClick={onRenew}>Продлить</GhostButton>
        </div>
      </div>
    </div>
  );
}
