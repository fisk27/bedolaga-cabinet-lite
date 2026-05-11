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
    <div className="relative overflow-hidden rounded-3xl border border-subo-hairline bg-subo-surface p-[22px]">
      <div className="relative">
        <StatusPill kind="active">Подписка активна</StatusPill>

        <div className="mt-[18px] font-subo text-[14px] tracking-[-0.005em] text-subo-textSoft">
          Осталось
        </div>

        <div className="mt-1 flex items-baseline gap-2.5">
          <div className="font-subo text-[48px] font-semibold leading-none tracking-[-0.04em] text-subo-text">
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
