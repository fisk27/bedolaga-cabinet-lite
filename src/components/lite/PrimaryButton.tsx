import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  pulse?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

export function PrimaryButton({
  children,
  onClick,
  pulse = false,
  icon,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-[14px] border-none px-5 font-subo text-[16px] font-semibold tracking-[-0.01em] text-subo-canaryInk',
        'bg-gradient-to-b from-subo-canaryHi via-subo-canary to-subo-canaryLo',
        'min-h-[54px]',
        pulse
          ? 'animate-subo-pulse shadow-[0_14px_36px_-8px_rgba(255,215,0,0.55),0_0_24px_-4px_rgba(255,215,0,0.40),inset_0_1px_0_0_rgba(255,255,255,0.40)]'
          : 'shadow-[0_12px_30px_-10px_rgba(255,215,0,0.50),0_0_18px_-6px_rgba(255,215,0,0.30),inset_0_1px_0_0_rgba(255,255,255,0.35)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {children}
      {icon}
    </button>
  );
}
