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
  const pct = totalGb > 0 ? Math.min(100, Math.max(0, (usedGb / totalGb) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-subo-hairline bg-subo-surface px-4 py-3.5">
      <div className="flex items-center gap-3.5">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-subo-surface2 text-subo-amber">
          <TrafficChartIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between">
            <div className="font-subo text-[14px] text-subo-textSoft">Расход трафика</div>
            <div className="font-subo text-[13px] font-medium text-subo-text">
              {formatGb(usedGb)}{' '}
              <span className="font-normal text-subo-textMute">/ {formatGb(totalGb)}</span>
            </div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-subo-text/[0.06]">
            <div className="h-full rounded-full bg-subo-amber" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
