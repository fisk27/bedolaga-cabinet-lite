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
        'relative inline-flex w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-[14px] border-none bg-subo-amber px-5 font-subo text-[16px] font-semibold tracking-[-0.01em] text-subo-amberInk',
        'min-h-[54px]',
        pulse
          ? 'animate-subo-pulse shadow-[0_8px_28px_-10px_#F2C12E]'
          : 'shadow-[0_6px_20px_-10px_#F2C12E]',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {children}
      {icon}
    </button>
  );
}
