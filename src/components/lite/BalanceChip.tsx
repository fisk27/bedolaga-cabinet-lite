interface BalanceChipProps {
  amount: number;
  onClick?: () => void;
}

export function BalanceChip({ amount, onClick }: BalanceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-subo-amber/20 bg-subo-amber/[0.08] px-3 font-subo text-[14px] font-semibold tracking-[-0.005em] text-subo-amber"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-subo-amber" />
      {amount} ₽
    </button>
  );
}
