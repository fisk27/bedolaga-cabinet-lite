import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  kind: 'active' | 'warn';
  children: ReactNode;
}

export function StatusPill({ kind, children }: StatusPillProps) {
  const isWarn = kind === 'warn';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-3 font-subo text-[13px] font-medium tracking-[-0.005em]',
        isWarn
          ? 'border-subo-amber/[0.19] bg-subo-amber/[0.08] text-subo-amber'
          : 'border-subo-green/20 bg-subo-green/[0.08] text-subo-text',
      )}
    >
      <span
        className={cn(
          'h-[7px] w-[7px] rounded-full',
          isWarn
            ? 'bg-subo-amber shadow-[0_0_0_3px_rgba(242,193,46,0.13)]'
            : 'bg-subo-green shadow-[0_0_0_3px_rgba(126,194,100,0.13)]',
        )}
      />
      {children}
    </div>
  );
}
