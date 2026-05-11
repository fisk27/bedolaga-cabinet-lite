import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
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
  const user = useAuthStore((state) => state.user);
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  useEffect(() => {
    const baseTitle = 'SUBO VPN';
    const pageTitle = variant === 'home' ? baseTitle : `${variant.title} · ${baseTitle}`;
    document.title = pageTitle;
  }, [variant]);

  const initials =
    (
      (user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? user?.username?.[0] ?? '')
    ).toUpperCase() || '?';
  const balance = balanceData?.balance_rubles ?? 0;

  const handleBalanceClick = () => navigate('/lite/balance');
  const handleBack = () => {
    if (window.history.length <= 1) {
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
