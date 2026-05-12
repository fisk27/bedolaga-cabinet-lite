import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { balanceApi } from '@/api/balance';
import { API } from '@/config/constants';
import { LiteHeader } from './LiteHeader';
import { FooterLinks } from './FooterLinks';

type LiteLayoutProps = {
  variant: 'home' | { title: string };
  // Used when the back button has no history to pop (deep link, fresh tab).
  backFallback?: string;
  children: ReactNode;
};

export function LiteLayout({ variant, backFallback = '/lite', children }: LiteLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const titleSuffix = variant === 'home' ? null : variant.title;

  useEffect(() => {
    const baseTitle = 'SUBO VPN';
    document.title = titleSuffix === null ? baseTitle : `${titleSuffix} · ${baseTitle}`;
  }, [titleSuffix]);

  // Track our own Lite navigation depth. window.history.length is polluted by
  // the Telegram bot's preceding entries, so back can fall out of the WebView.
  // sessionStorage clears on tab close, so each fresh WebView session starts at 0.
  useEffect(() => {
    const current = parseInt(sessionStorage.getItem('lite-nav-depth') ?? '0', 10);
    sessionStorage.setItem('lite-nav-depth', String(current + 1));
    return () => {
      const c = parseInt(sessionStorage.getItem('lite-nav-depth') ?? '1', 10);
      sessionStorage.setItem('lite-nav-depth', String(Math.max(0, c - 1)));
    };
  }, []);

  const initials =
    (
      (user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? user?.username?.[0] ?? '')
    ).toUpperCase() || '?';
  const balance = balanceData?.balance_rubles ?? 0;

  const handleBalanceClick = () => {
    if (location.pathname !== '/lite/balance') {
      navigate('/lite/balance');
    }
  };
  const handleBack = () => {
    const depth = parseInt(sessionStorage.getItem('lite-nav-depth') ?? '0', 10);
    if (depth <= 1) {
      navigate(backFallback, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-subo-bg font-subo text-subo-text">
      <div className="mx-auto flex max-w-[420px] flex-col">
        {variant === 'home' ? (
          <LiteHeader
            mode="home"
            user={{ initials, balance }}
            onBalanceClick={handleBalanceClick}
          />
        ) : (
          <LiteHeader
            mode="inner"
            title={variant.title}
            balance={balance}
            onBack={handleBack}
            onBalanceClick={handleBalanceClick}
          />
        )}
        <main className="px-[22px]">{children}</main>
        <FooterLinks />
      </div>
    </div>
  );
}
