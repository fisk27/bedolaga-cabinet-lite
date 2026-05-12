import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { isInTelegramWebApp } from '@/hooks/useTelegramSDK';

const REDIRECTS: Record<string, string> = {
  '/': '/lite',
  '/subscription': '/lite',
  '/subscription/purchase': '/lite/tariffs',
  '/tariffs': '/lite/tariffs',
  '/balance': '/lite/balance',
  '/info': '/lite/info',
};

export function TelegramRedirect({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isInTelegramWebApp()) return <>{children}</>;

  const target = REDIRECTS[location.pathname];
  if (target && target !== location.pathname) {
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
