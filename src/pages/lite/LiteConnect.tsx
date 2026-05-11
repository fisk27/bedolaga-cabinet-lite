import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { subscriptionApi } from '@/api/subscription';
import { resolveConnectionUrlForUi } from '@/utils/connectionLink';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { GhostButton } from '@/components/lite/GhostButton';

const PLATFORM_LABELS: Record<string, { title: string; subtitle?: string }> = {
  ios: { title: 'iOS', subtitle: 'iPhone, iPad' },
  android: { title: 'Android' },
  macos: { title: 'macOS', subtitle: 'Mac' },
  windows: { title: 'Windows' },
  pc: { title: 'Linux', subtitle: 'PC' },
};

const PLATFORM_ORDER = ['ios', 'android', 'macos', 'windows', 'pc'];

type PlatformInfo = { name: string; icon: string; link: string };

function DownloadGrid({ platforms }: { platforms: Record<string, PlatformInfo> }) {
  const entries = Object.entries(platforms).filter(([, p]) => p?.link);
  const sorted = entries.sort(([a], [b]) => {
    const ai = PLATFORM_ORDER.indexOf(a);
    const bi = PLATFORM_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  if (sorted.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="font-subo text-[13px] text-subo-textSoft">Нет приложения?</p>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map(([key, platform]) => {
          const label = PLATFORM_LABELS[key];
          const title = label?.title ?? platform.name;
          const subtitle = label?.subtitle;
          return (
            <a
              key={key}
              href={platform.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-subo-hairline bg-subo-surface2 p-4 transition-colors hover:bg-subo-text/[0.04]"
            >
              <span className="font-subo text-[14px] font-semibold text-subo-text">{title}</span>
              {subtitle && (
                <span className="font-subo text-[12px] text-subo-textSoft">{subtitle}</span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function LiteConnect() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

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

  const { data: downloads } = useQuery({
    queryKey: ['happ-downloads'],
    queryFn: () => subscriptionApi.getHappDownloads(),
    staleTime: 5 * 60_000,
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

  const handleCopy = async () => {
    if (!canonicalUrl) return;
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — fallback not needed for now
    }
  };

  const hasDownloads =
    downloads?.happ_enabled === true &&
    Object.values(downloads.platforms ?? {}).some((p) => p?.link);

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

        <div className="flex w-full flex-col items-center gap-3">
          <div className="rounded-2xl bg-white p-5">
            <QRCodeSVG value={canonicalUrl} size={240} level="M" includeMargin={false} />
          </div>
          <p className="text-center font-subo text-[13px] text-subo-textSoft">
            Или отсканируйте QR в Happ
          </p>
          <GhostButton onClick={handleCopy}>
            {copied ? 'Скопировано ✓' : 'Скопировать ссылку'}
          </GhostButton>
        </div>

        {hasDownloads && <DownloadGrid platforms={downloads!.platforms} />}
      </div>
    );
  }

  return (
    <LiteLayout variant={{ title: 'Подключение' }}>
      <div className="flex flex-col gap-4 pb-6 pt-4">{body}</div>
    </LiteLayout>
  );
}
