import { PrimaryButton } from './PrimaryButton';
import { GhostButton } from './GhostButton';
import { ShieldIcon, ArrowIcon } from './icons';

interface HeroCardInactiveProps {
  onSelectTariff: () => void;
  onTrial: () => void;
  fromPrice?: number;
  trialAvailable?: boolean;
  trialPending?: boolean;
}

export function HeroCardInactive({
  onSelectTariff,
  onTrial,
  fromPrice = 199,
  trialAvailable = true,
  trialPending = false,
}: HeroCardInactiveProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl px-6 pb-7 pt-8',
        'border border-subo-canary/[0.18]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,215,0,0.05)]',
      ].join(' ')}
      style={{
        background: 'rgba(255,255,255,0.025)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[60px] -top-[60px] h-[180px] w-[180px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.33), transparent 70%)',
        }}
      />

      <div className="mb-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-subo-canary/[0.10] text-subo-canary shadow-[inset_0_0_0_1px_rgba(255,215,0,0.20),inset_0_0_18px_-6px_rgba(255,215,0,0.40)]">
        <ShieldIcon />
      </div>

      <h2 className="mb-2.5 font-subo text-[26px] font-semibold leading-[1.18] tracking-[-0.02em] text-subo-text">
        {'Подключите SUBO VPN'}
      </h2>

      <p className="mb-7 font-subo text-[15px] leading-[1.45] text-subo-textSoft">
        Быстрое и приватное подключение на любом устройстве.
      </p>

      <PrimaryButton onClick={onSelectTariff} icon={<ArrowIcon />}>
        Выбрать тариф
      </PrimaryButton>

      {trialAvailable && (
        <div className="mt-2.5">
          <GhostButton accent onClick={onTrial} disabled={trialPending}>
            Попробовать бесплатно
          </GhostButton>
        </div>
      )}

      <div className="mt-3.5 text-center font-subo text-[13px] text-subo-textMute">
        от <span className="font-medium text-subo-textSoft">{fromPrice} ₽/мес</span> · отмена в
        любой момент
      </div>
    </div>
  );
}
