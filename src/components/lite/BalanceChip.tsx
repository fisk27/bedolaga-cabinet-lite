interface BalanceChipProps {
  amount: number;
  onClick?: () => void;
}

export function BalanceChip({ amount, onClick }: BalanceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-subo-canary/[0.40] bg-gradient-to-b from-subo-canary/[0.20] to-subo-canary/[0.08] px-3 font-subo text-[14px] font-semibold tracking-[-0.005em] text-subo-canaryHi shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_0_14px_-2px_rgba(255,215,0,0.35)]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-subo-canary shadow-[0_0_0_3px_rgba(255,215,0,0.28),0_0_12px_rgba(255,215,0,0.9)]" />
      {amount} ₽
    </button>
  );
}
