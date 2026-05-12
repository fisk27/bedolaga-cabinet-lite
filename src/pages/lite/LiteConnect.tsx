import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { subscriptionApi } from '@/api/subscription';
import { API } from '@/config/constants';
import { resolveConnectionUrlForUi } from '@/utils/connectionLink';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { GhostButton } from '@/components/lite/GhostButton';

type Platform = 'ios' | 'android' | 'macos' | 'windows';

const PLATFORM_ORDER: Platform[] = ['ios', 'android', 'macos', 'windows'];

const PLATFORM_LABELS: Record<Platform, string> = {
  ios: 'iOS (iPhone, iPad)',
  android: 'Android',
  macos: 'macOS',
  windows: 'Windows',
};

const detectPlatform = (): Platform => {
  const tgPlatform = window.Telegram?.WebApp?.platform;
  if (tgPlatform === 'ios') return 'ios';
  if (tgPlatform === 'android') return 'android';
  if (tgPlatform === 'macos') return 'macos';
  if (tgPlatform === 'tdesktop' || tgPlatform === 'web') return 'windows';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  return 'windows';
};

const openExternal = (url: string) => {
  const tg = window.Telegram?.WebApp;
  if (tg && typeof tg.openLink === 'function') {
    tg.openLink(url, { try_instant_view: false });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default function LiteConnect() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: multiSubData, isLoading: multiSubLoading } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    enabled: !isMultiTariff,
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const fullSub = subscriptionResponse?.subscription ?? null;
  const multiFirst = multiSubData?.subscriptions?.[0] ?? null;
  const subscriptionId = fullSub?.id ?? multiFirst?.id ?? null;

  const { data: connectionLink, isLoading: linkLoading } = useQuery({
    queryKey: ['connection-link', subscriptionId],
    queryFn: () => subscriptionApi.getConnectionLink(subscriptionId ?? undefined),
    enabled: !!subscriptionId,
    retry: false,
    staleTime: 30_000,
  });

  const { data: appConfig } = useQuery({
    queryKey: ['app-config', subscriptionId],
    queryFn: () => subscriptionApi.getAppConfig(subscriptionId ?? undefined),
    enabled: !!subscriptionId,
    staleTime: 60_000,
  });

  const { data: downloads } = useQuery({
    queryKey: ['happ-downloads'],
    queryFn: () => subscriptionApi.getHappDownloads(),
    staleTime: 5 * 60_000,
  });

  const isResolvingSub = multiSubLoading || (!isMultiTariff && subLoading);
  const hasSubscription = !!fullSub || !!multiFirst;

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

  const happUrl = useMemo(() => {
    if (!canonicalUrl) return null;
    // happ:// schemes don't open from Telegram WebView directly — wrap in our /happ-redirect HTTPS bouncer.
    if (!/^https?:\/\//i.test(canonicalUrl)) {
      return `${window.location.origin}/happ-redirect?to=${encodeURIComponent(canonicalUrl)}`;
    }
    // Plain HTTPS subscription URL — open directly.
    return canonicalUrl;
  }, [canonicalUrl]);

  const openHapp = () => {
    if (!happUrl) return;
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.openLink === 'function') {
      // Telegram WebApp — open in external browser so the WebView stays on /lite/connect.
      tg.openLink(happUrl, { try_instant_view: false });
      return;
    }
    window.location.href = happUrl;
  };

  const handleCopy = async () => {
    if (!canonicalUrl) return;
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2000);
    }
  };

  const detectedPlatform = useMemo<Platform>(() => detectPlatform(), []);
  const platformsWithLink = useMemo<Platform[]>(() => {
    if (!downloads || downloads.happ_enabled !== true) return [];
    return PLATFORM_ORDER.filter((p) => downloads.platforms?.[p]?.link);
  }, [downloads]);
  const primaryPlatform: Platform | null = platformsWithLink.includes(detectedPlatform)
    ? detectedPlatform
    : (platformsWithLink[0] ?? null);
  const otherPlatforms = platformsWithLink.filter((p) => p !== primaryPlatform);

  let body: ReactNode;
  if (isResolvingSub || (hasSubscription && linkLoading)) {
    body = (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="h-[280px] w-[280px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface" />
        <div className="h-[54px] w-full max-w-[280px] animate-pulse rounded-[14px] border border-subo-hairline bg-subo-surface" />
      </div>
    );
  } else if (!hasSubscription) {
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
      <div className="flex flex-col gap-7">
        <p className="font-subo text-[14px] leading-[1.5] text-subo-textSoft">
          Для работы VPN нужно приложение Happ. Установите его и подключитесь.
        </p>

        {primaryPlatform && (
          <section>
            <div className="mb-3 font-subo text-[14px] uppercase tracking-[0.06em] text-subo-textSoft">
              1. Установите приложение Happ
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryButton
                onClick={() => openExternal(downloads!.platforms[primaryPlatform]!.link)}
              >
                Скачать для {PLATFORM_LABELS[primaryPlatform]}
              </PrimaryButton>
              {otherPlatforms.length > 0 && (
                <div className="mt-1 flex flex-col items-center gap-2">
                  <p className="font-subo text-[13px] text-subo-textSoft">Другая платформа?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {otherPlatforms.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => openExternal(downloads!.platforms[p]!.link)}
                        className="cursor-pointer rounded-full border border-subo-hairline bg-transparent px-3.5 py-1.5 font-subo text-[13px] text-subo-textSoft transition-colors hover:bg-subo-hairline"
                      >
                        {PLATFORM_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 font-subo text-[14px] uppercase tracking-[0.06em] text-subo-textSoft">
            2. Подключитесь
          </div>
          <div className="flex flex-col gap-3">
            {happUrl && (
              <div className="flex flex-col items-center gap-2">
                <PrimaryButton onClick={openHapp}>Открыть в Happ</PrimaryButton>
                <p className="text-center font-subo text-[13px] leading-[1.4] text-subo-textSoft">
                  Если приложение установлено, подписка добавится автоматически
                </p>
              </div>
            )}
            <GhostButton onClick={() => setQrOpen((o) => !o)}>
              {qrOpen ? 'Скрыть QR код' : 'Показать QR код'}
            </GhostButton>
            {qrOpen && (
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-2xl bg-white p-5">
                  <QRCodeSVG value={canonicalUrl} size={240} level="M" includeMargin={false} />
                </div>
                <p className="text-center font-subo text-[13px] text-subo-textSoft">
                  Отсканируйте QR в Happ
                </p>
              </div>
            )}
            <GhostButton onClick={handleCopy}>
              {copyError ? 'Ошибка' : copied ? 'Скопировано ✓' : 'Скопировать ссылку'}
            </GhostButton>
          </div>
        </section>
      </div>
    );
  }

  return (
    <LiteLayout variant={{ title: 'Подключение' }}>
      <div className="flex flex-col gap-4 pb-6 pt-4">{body}</div>
    </LiteLayout>
  );
}
