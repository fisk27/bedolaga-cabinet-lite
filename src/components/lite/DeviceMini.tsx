import { DeviceIcon } from './icons';

interface DeviceMiniProps {
  used: number;
  total: number;
}

export function DeviceMini({ used, total }: DeviceMiniProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

  return (
    <div
      className="relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-subo-canary/[0.08] bg-white/[0.03] px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px]"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.10), transparent 65%), rgba(255,255,255,0.025)',
      }}
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center text-subo-canary [&>svg]:h-6 [&>svg]:w-6">
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
          <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
