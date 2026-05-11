import { DeviceIcon } from './icons';

interface DeviceMiniProps {
  used: number;
  total: number;
}

export function DeviceMini({ used, total }: DeviceMiniProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-subo-hairline bg-subo-surface px-4 py-3.5">
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-subo-surface2 text-subo-text">
        <DeviceIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <div className="font-subo text-[14px] text-subo-textSoft">Устройства</div>
          <div className="font-subo text-[13px] font-medium text-subo-text">
            {used} из {total}
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-subo-text/[0.06]">
          <div className="h-full rounded-full bg-subo-amber" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
