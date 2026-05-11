import { Link } from 'react-router';

export function FooterLinks() {
  // TODO: split "Правила" off to its own /lite/rules page once we have one.
  return (
    <div className="flex justify-center gap-[18px] px-[22px] pb-7 pt-[22px] font-subo text-[13px] text-subo-textMute">
      <Link to="/lite/info" className="text-subo-textMute no-underline">
        FAQ
      </Link>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <Link to="/lite/support" className="text-subo-textMute no-underline">
        Поддержка
      </Link>
      <span aria-hidden className="opacity-40">
        ·
      </span>
      <Link to="/lite/info" className="text-subo-textMute no-underline">
        Правила
      </Link>
    </div>
  );
}
