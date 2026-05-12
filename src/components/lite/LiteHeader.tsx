import { Avatar } from './Avatar';
import { SuboLogo } from './SuboLogo';
import { BalanceChip } from './BalanceChip';
import { ArrowIcon } from './icons';

type LiteHeaderProps =
  | {
      mode: 'home';
      user: { initials: string; balance: number; photoUrl?: string | null };
      onBalanceClick: () => void;
    }
  | {
      mode: 'inner';
      title: string;
      balance: number;
      onBack: () => void;
      onBalanceClick: () => void;
    };

export function LiteHeader(props: LiteHeaderProps) {
  return (
    <div
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
    >
      <div className="relative flex min-h-[100px] items-center justify-between gap-2 px-[18px] pb-3">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-subo-text">
          <SuboLogo size={100} />
        </div>

        <div className="relative z-10 shrink-0">
          {props.mode === 'home' ? (
            <Avatar initials={props.user.initials} photoUrl={props.user.photoUrl} />
          ) : (
            <button
              type="button"
              onClick={props.onBack}
              aria-label="Назад"
              className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-subo-hairline bg-transparent p-0 text-subo-textSoft transition-colors hover:bg-subo-hairline"
            >
              <ArrowIcon className="rotate-180" />
            </button>
          )}
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          {props.mode === 'home' ? (
            <BalanceChip amount={props.user.balance} onClick={props.onBalanceClick} />
          ) : (
            <BalanceChip amount={props.balance} onClick={props.onBalanceClick} />
          )}
        </div>
      </div>

      {props.mode === 'inner' && (
        <div className="px-[18px] pb-3 text-center font-subo text-[18px] font-semibold text-subo-text">
          {props.title}
        </div>
      )}
    </div>
  );
}
