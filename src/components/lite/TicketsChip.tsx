interface TicketsChipProps {
  count: number;
  onClick?: () => void;
}

export function TicketsChip({ count, onClick }: TicketsChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-subo-canary/[0.28] bg-subo-canary/[0.10] px-2.5 py-1 font-subo text-[13px] font-semibold tracking-[-0.005em] text-subo-canaryHi"
      aria-label="Билеты розыгрыша"
    >
      <span className="text-[14px] leading-none">🎟</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
