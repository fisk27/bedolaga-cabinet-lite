import { StarIcon } from './icons';

interface TariffCardProps {
  name: string;
  period: string;
  onChange: () => void;
}

export function TariffCard({ name, period: _period, onChange }: TariffCardProps) {
  return (
    <div
      className="relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-subo-canary/[0.08] bg-white/[0.03] px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px]"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.10), transparent 65%), rgba(255,255,255,0.025)',
      }}
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center text-subo-canaryHi [&>svg]:h-6 [&>svg]:w-6">
        <StarIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 font-subo text-[14px] font-medium tracking-[-0.005em] text-white">
          Текущий тариф
        </div>
        <div className="font-subo text-[15px] font-medium tracking-[-0.005em] text-sky-400">
          {name}
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="cursor-pointer rounded-full bg-gradient-to-b from-subo-canaryHi via-subo-canary to-subo-canaryLo px-2.5 py-1 font-subo text-[12px] font-semibold text-subo-canaryInk shadow-[0_4px_12px_-4px_rgba(255,215,0,0.40),inset_0_1px_0_0_rgba(255,255,255,0.30)]"
      >
        Сменить
      </button>
    </div>
  );
}
