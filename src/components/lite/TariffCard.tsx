import { SparkIcon } from './icons';

interface TariffCardProps {
  name: string;
  period: string;
  onChange: () => void;
}

export function TariffCard({ name, period, onChange }: TariffCardProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-subo-hairline bg-subo-surface px-4 py-3.5">
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-subo-surface2 text-subo-amber">
        <SparkIcon />
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
        className="cursor-pointer border-none bg-transparent px-2 py-1.5 font-subo text-[13px] font-medium tracking-[-0.005em] text-subo-amber"
      >
        Сменить
      </button>
    </div>
  );
}
