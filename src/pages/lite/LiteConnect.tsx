import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { subscriptionApi } from '@/api/subscription';
import { resolveConnectionUrlForUi } from '@/utils/connectionLink';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';

export default function LiteConnect() {
  const navigate = useNavigate();

  const { data: connectionLink, isLoading: linkLoading } = useQuery({
    queryKey: ['connection-link'],
    queryFn: () => subscriptionApi.getConnectionLink(),
    retry: false,
    staleTime: 30_000,
  });

  const { data: appConfig } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => subscriptionApi.getAppConfig(),
    staleTime: 60_000,
  });

  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    staleTime: 60_000,
  });

  const subscription = subscriptionResponse?.subscription ?? null;

  // resolveConnectionUrlForUi takes a single camelCase options object — map
  // the snake_case API fields the same way Connection.tsx does.
  const canonicalUrl = useMemo(
    () =>
      resolveConnectionUrlForUi({
        mode: connectionLink?.connect_mode,
        subscriptionUrl: connectionLink?.subscription_url,
        displayLink: connectionLink?.display_link,
        happSchemeLink: connectionLink?.happ_scheme_link,
        happCryptLink: connectionLink?.happ_cryptolink,
        happCryptoLink: connectionLink?.happ_crypto_link,
        happLink: connectionLink?.happ_link,
        fallbackUrl: appConfig?.subscriptionUrl,
      }),
    [connectionLink, appConfig],
  );

  const happUrl =
    connectionLink?.happ_redirect_link ||
    connectionLink?.happ_link ||
    connectionLink?.happ_cryptolink ||
    null;

  let body: ReactNode;
  if (linkLoading) {
    body = (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="h-[280px] w-[280px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface" />
        <div className="h-[54px] w-full max-w-[280px] animate-pulse rounded-[14px] border border-subo-hairline bg-subo-surface" />
      </div>
    );
  } else if (!subscription) {
    body = (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-subo-hairline bg-subo-surface px-6 py-10 text-center">
        <p className="font-subo text-[15px] leading-[1.45] text-subo-textSoft">
          У вас пока нет активной подписки
        </p>
        <PrimaryButton onClick={() => navigate('/lite/tariffs')}>Выбрать тариф</PrimaryButton>
      </div>
    );
  } else if (!canonicalUrl) {
    body = (
      <div className="rounded-2xl border border-subo-amber/30 bg-subo-amber/[0.08] px-4 py-3 text-center font-subo text-[14px] font-medium text-subo-amber">
        Не удалось получить ссылку. Попробуйте обновить страницу.
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col items-center gap-6">
        {happUrl && (
          <div className="flex w-full flex-col items-center gap-2">
            <PrimaryButton onClick={() => window.open(happUrl, '_blank', 'noopener')}>
              Открыть в Happ
            </PrimaryButton>
            <p className="text-center font-subo text-[13px] leading-[1.4] text-subo-textSoft">
              Если приложение установлено — подписка добавится автоматически
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-5">
            <QRCodeSVG value={canonicalUrl} size={240} level="M" includeMargin={false} />
          </div>
          <p className="text-center font-subo text-[13px] text-subo-textSoft">
            Или отсканируйте QR в Happ
          </p>
        </div>
      </div>
    );
  }

  return (
    <LiteLayout variant={{ title: 'Подключение' }}>
      <div className="flex flex-col gap-4 pb-6 pt-4">{body}</div>
    </LiteLayout>
  );
}
