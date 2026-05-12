import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GhostButtonProps {
  children: ReactNode;
  onClick?: () => void;
  accent?: boolean;
  disabled?: boolean;
}

export function GhostButton({
  children,
  onClick,
  accent = false,
  disabled = false,
}: GhostButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-transparent px-5 font-subo text-[15px] font-medium tracking-[-0.01em]',
        'min-h-[52px] border',
        accent
          ? 'border-subo-canary/[0.30] text-subo-canary'
          : 'border-subo-hairline text-subo-text',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {children}
    </button>
  );
}
