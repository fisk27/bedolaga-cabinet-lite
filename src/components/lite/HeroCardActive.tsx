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
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,215,0,0.05)]',
      ].join(' ')}
      style={{
        background:
          'radial-gradient(140% 90% at 100% 0%, rgba(255,215,0,0.21), transparent 55%), radial-gradient(120% 90% at 0% 100%, rgba(255,215,0,0.09), transparent 60%), rgba(255,255,255,0.025)',
      }}
    >
      <div className="relative">
        <div className="flex justify-center">
          <StatusPill kind="active">Подписка активна</StatusPill>
        </div>

        <div className="mt-[18px] text-center">
          <div className="flex items-baseline justify-center gap-2.5">
            <div className="font-subo text-[48px] font-bold leading-none tracking-[-0.045em] text-white [font-feature-settings:'tnum'_1,'lnum'_1]">
              {daysLeft}
            </div>
            <div className="font-subo text-[20px] font-medium tracking-[-0.02em] text-white">
              {plural(daysLeft, ['день', 'дня', 'дней'])}
            </div>
          </div>
          <div className="mt-1.5 font-subo text-[13px] text-subo-textMute">до {endDate}</div>
        </div>

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
