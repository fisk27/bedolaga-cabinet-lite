import { Avatar } from './Avatar';
import { SuboLogo } from './SuboLogo';
import { BalanceChip } from './BalanceChip';
import { ArrowIcon, BurgerIcon } from './icons';

type LiteHeaderProps =
  | {
      mode: 'home';
      user: { initials: string; balance: number };
      onMenuClick: () => void;
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
      className="grid items-center gap-2 px-[18px] pb-3"
      style={{
        gridTemplateColumns: '1fr auto 1fr',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}
    >
      <div className="flex justify-start">
        {props.mode === 'home' ? (
          <Avatar initials={props.user.initials} />
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

      <div className="flex flex-col items-center text-subo-text">
        <SuboLogo size={18} />
        {props.mode === 'inner' && (
          <div className="mt-1 font-subo text-[13px] leading-none text-subo-textSoft">
            {props.title}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5">
        {props.mode === 'home' ? (
          <>
            <BalanceChip amount={props.user.balance} onClick={props.onBalanceClick} />
            <button
              type="button"
              onClick={props.onMenuClick}
              aria-label="Меню"
              className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent p-0 text-subo-textSoft"
            >
              <BurgerIcon />
            </button>
          </>
        ) : (
          <BalanceChip amount={props.balance} onClick={props.onBalanceClick} />
        )}
      </div>
    </div>
  );
}
