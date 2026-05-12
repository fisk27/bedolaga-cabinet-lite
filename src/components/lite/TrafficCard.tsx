import { TrafficChartIcon } from './icons';

interface TrafficCardProps {
  usedGb: number;
  totalGb: number;
}

function formatGb(g: number) {
  if (g >= 1) return `${g.toFixed(1).replace(/\.0$/, '')} GB`;
  return `${Math.round(g * 1000)} MB`;
}

export function TrafficCard({ usedGb, totalGb }: TrafficCardProps) {
  const isUnlimited = !totalGb || totalGb === 0;
  const pct = isUnlimited ? 100 : Math.min(100, Math.max(0, (usedGb / totalGb) * 100));

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-subo-canary/[0.08] bg-white/[0.03] px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px]"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.10), transparent 65%), rgba(255,255,255,0.025)',
      }}
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 flex-none items-center justify-center text-subo-canaryHi [&>svg]:h-6 [&>svg]:w-6">
          <TrafficChartIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between">
            <div className="font-subo text-[14px] font-medium tracking-[-0.005em] text-white">
              Расход трафика
            </div>
            <div className="font-subo text-[13px] font-medium text-subo-text">
              {formatGb(usedGb)}{' '}
              <span className="font-normal text-subo-textMute">
                / {isUnlimited ? '∞' : formatGb(totalGb)}
              </span>
            </div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-subo-text/[0.05] shadow-[inset_0_1px_0_0_rgba(0,0,0,0.4)]">
            <div
              className={
                isUnlimited
                  ? 'h-full rounded-full bg-sky-400'
                  : 'h-full rounded-full bg-gradient-to-r from-subo-canaryLo via-subo-canary to-subo-canaryHi'
              }
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
