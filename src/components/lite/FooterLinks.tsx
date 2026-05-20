import { Link } from 'react-router';

export function FooterLinks() {
  return (
    <div className="flex flex-col items-center gap-2 px-[22px] pb-7 pt-[22px] font-subo text-[13px] text-subo-textMute">
      <div className="flex justify-center gap-[18px]">
        <Link to="/lite/info" className="text-subo-textMute no-underline">
          Информация
        </Link>
        <span aria-hidden className="opacity-40">
          ·
        </span>
        <Link to="/lite/support" className="text-subo-textMute no-underline">
          Поддержка
        </Link>
      </div>
      <Link to="/lite/referral" className="text-subo-textMute no-underline">
        Пригласи друга
      </Link>
    </div>
  );
}
