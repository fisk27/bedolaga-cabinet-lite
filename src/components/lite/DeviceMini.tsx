import { DeviceIcon } from './icons';

interface DeviceMiniProps {
  used: number;
  total: number;
}

export function DeviceMini({ used, total }: DeviceMiniProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-subo-hairline bg-subo-surface px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.025)]">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-subo-canary/[0.22] bg-gradient-to-br from-[#2A2510] to-[#14110B] text-subo-canary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),inset_0_0_14px_-6px_rgba(255,215,0,0.28)]">
        <DeviceIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between">
          <div className="font-subo text-[14px] text-subo-textSoft">Устройства</div>
          <div className="font-subo text-[13px] font-medium text-subo-text">
            {used} из {total}
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-subo-text/[0.05] shadow-[inset_0_1px_0_0_rgba(0,0,0,0.4)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-subo-canaryLo via-subo-canary to-subo-canaryHi"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
