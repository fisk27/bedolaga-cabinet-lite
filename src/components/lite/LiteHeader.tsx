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
      className="flex items-center justify-between gap-2 px-[18px] pb-3"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
    >
      <div className="shrink-0">
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

      <div className="flex min-w-0 flex-1 flex-col items-center text-subo-text">
        <SuboLogo size={100} />
        {props.mode === 'inner' && (
          <div className="mt-1 font-subo text-[13px] leading-none text-subo-textSoft">
            {props.title}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {props.mode === 'home' ? (
          <BalanceChip amount={props.user.balance} onClick={props.onBalanceClick} />
        ) : (
          <BalanceChip amount={props.balance} onClick={props.onBalanceClick} />
        )}
      </div>
    </div>
  );
}
