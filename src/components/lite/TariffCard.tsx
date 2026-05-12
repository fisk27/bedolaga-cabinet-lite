import { StarIcon } from './icons';

interface TariffCardProps {
  name: string;
  period: string;
  onChange: () => void;
}

export function TariffCard({ name, period, onChange }: TariffCardProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-subo-canary/[0.10] bg-subo-surface/60 px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-[12px]">
      <div className="flex h-10 w-10 flex-none items-center justify-center text-subo-canary [&>svg]:h-6 [&>svg]:w-6">
        <StarIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 font-subo text-[13px] text-subo-textSoft">Текущий тариф</div>
        <div className="font-subo text-[15px] font-medium tracking-[-0.005em] text-subo-text">
          {name} <span className="font-normal text-subo-textMute">· {period}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="cursor-pointer border-none bg-transparent px-2 py-1.5 font-subo text-[13px] font-medium tracking-[-0.005em] text-subo-canary"
      >
        Сменить
      </button>
    </div>
  );
}
