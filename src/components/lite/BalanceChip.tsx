interface BalanceChipProps {
  amount: number;
  onClick?: () => void;
}

export function BalanceChip({ amount, onClick }: BalanceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1 font-subo text-[15px] font-semibold tracking-[-0.005em] text-subo-canaryHi"
    >
      {amount} ₽
    </button>
  );
}
