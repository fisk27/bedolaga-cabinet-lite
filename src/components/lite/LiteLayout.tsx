import { useCallback, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useBranding } from '@/hooks/useBranding';
import { balanceApi } from '@/api/balance';
import { wheelApi } from '@/api/wheel';
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
  // useBranding also applies the admin-uploaded favicon to <link rel="icon"> via its own effect.
  const { appName } = useBranding();
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });
  const { data: wheelConfig } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
    staleTime: 60_000,
  });

  const titleSuffix = variant === 'home' ? null : variant.title;
  const baseTitle = appName || 'SUBO VPN';

  useEffect(() => {
    document.title = titleSuffix === null ? baseTitle : `${titleSuffix} · ${baseTitle}`;
  }, [titleSuffix, baseTitle]);

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
  // User type has no photo_url; the only source is the Telegram WebApp init data.
  const photoUrl =
    (typeof window !== 'undefined'
      ? window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url
      : null) ?? null;

  const handleBalanceClick = () => {
    if (location.pathname !== '/lite/balance') {
      navigate('/lite/balance');
    }
  };
  const handleTicketsClick = () => {
    if (location.pathname !== '/lite/giveaway') {
      navigate('/lite/giveaway');
    }
  };
  const tickets = wheelConfig?.is_enabled ? (wheelConfig.spin_tickets_balance ?? 0) : null;
  const handleBack = useCallback(() => {
    const depth = parseInt(sessionStorage.getItem('lite-nav-depth') ?? '0', 10);
    if (depth <= 1) {
      navigate(backFallback, { replace: true });
    } else {
      navigate(-1);
    }
  }, [backFallback, navigate]);

  // Telegram WebApp BackButton: home → close mini app; inner pages → in-Lite back.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const isHome = location.pathname === '/lite';
    tg.BackButton.show();

    const handler = () => {
      if (isHome) {
        tg.close();
      } else {
        handleBack();
      }
    };

    tg.BackButton.onClick(handler);

    return () => {
      tg.BackButton?.offClick(handler);
    };
  }, [location.pathname, handleBack]);

  return (
    <div className="min-h-screen bg-subo-bg font-subo text-subo-text">
      <div className="mx-auto flex max-w-[420px] flex-col">
        {variant === 'home' ? (
          <LiteHeader
            mode="home"
            user={{ initials, balance, photoUrl }}
            onBalanceClick={handleBalanceClick}
            tickets={tickets}
            onTicketsClick={handleTicketsClick}
          />
        ) : (
          <LiteHeader
            mode="inner"
            title={variant.title}
            balance={balance}
            onBack={handleBack}
            onBalanceClick={handleBalanceClick}
            tickets={tickets}
            onTicketsClick={handleTicketsClick}
          />
        )}
        <main className="px-[22px]">{children}</main>
        <FooterLinks />
      </div>
    </div>
  );
}
