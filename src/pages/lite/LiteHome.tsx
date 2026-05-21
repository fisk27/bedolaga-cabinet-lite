import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { API } from '@/config/constants';
import { plural } from '@/utils/plural';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { HeroCardInactive } from '@/components/lite/HeroCardInactive';
import { HeroCardActive } from '@/components/lite/HeroCardActive';
import { HeroCardExpiring } from '@/components/lite/HeroCardExpiring';
import { TrafficCard } from '@/components/lite/TrafficCard';
import { DeviceMini } from '@/components/lite/DeviceMini';
import { TariffCard } from '@/components/lite/TariffCard';

const RU_MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

function formatRussianDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${RU_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function daysLeftFromEndDate(endDate: string | null | undefined): number {
  if (!endDate) return 0;
  const ms = new Date(endDate).getTime() - Date.now();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

// Best-effort period string from start/end. Real period lives on the Tariff
// endpoint; this approximation is fine for the secondary line in TariffCard.
function calcPeriod(start: string | undefined, end: string | undefined): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const days = Math.max(1, Math.round(ms / 86_400_000));
  if (days <= 7) return `${days} ${plural(days, ['день', 'дня', 'дней'])}`;
  if (days <= 35) return '1 месяц';
  if (days <= 95) return '3 месяца';
  if (days <= 200) return '6 месяцев';
  return '1 год';
}

// Normalized shape used for rendering, regardless of single- or multi-tariff source.
interface LiteSub {
  daysLeft: number;
  isExpired: boolean;
  isTrial: boolean;
  endDate: string;
  startDate?: string;
  trafficUsedGb: number;
  trafficLimitGb: number;
  deviceLimit: number;
  tariffName: string;
}

export default function LiteHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Multi-tariff gate (same pattern as Dashboard).
  const { data: multiSubData, isLoading: multiSubLoading } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: API.BALANCE_STALE_TIME_MS,
  });
  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
    enabled: !isMultiTariff,
  });

  const fullSub = subscriptionResponse?.subscription ?? null;
  // Multi-tariff: surface only the first subscription until post-launch per-sub UI lands.
  const multiFirst = isMultiTariff ? (multiSubData?.subscriptions?.[0] ?? null) : null;
  const subscriptionId = fullSub?.id ?? multiFirst?.id ?? null;

  let subscription: LiteSub | null = null;
  if (fullSub) {
    subscription = {
      daysLeft: fullSub.days_left,
      isExpired: fullSub.is_expired,
      isTrial: fullSub.is_trial,
      endDate: fullSub.end_date,
      startDate: fullSub.start_date,
      trafficUsedGb: fullSub.traffic_used_gb,
      trafficLimitGb: fullSub.traffic_limit_gb,
      deviceLimit: fullSub.device_limit,
      tariffName: fullSub.tariff_name || 'Тариф',
    };
  } else if (multiFirst) {
    const daysLeft = daysLeftFromEndDate(multiFirst.end_date);
    subscription = {
      daysLeft,
      isExpired: daysLeft <= 0,
      isTrial: multiFirst.is_trial,
      endDate: multiFirst.end_date ?? '',
      trafficUsedGb: multiFirst.traffic_used_gb,
      trafficLimitGb: multiFirst.traffic_limit_gb,
      deviceLimit: multiFirst.device_limit,
      tariffName: multiFirst.tariff_name || 'Тариф',
    };
  }

  const { data: devicesData } = useQuery({
    queryKey: ['devices', subscriptionId],
    queryFn: () => subscriptionApi.getDevices(subscriptionId ?? undefined),
    enabled: !!subscriptionId,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo(),
    enabled: !subscription && !subLoading && !multiSubLoading,
  });

  const [trialError, setTrialError] = useState<string | null>(null);

  const activateTrial = useMutation<unknown, { response?: { data?: { detail?: string } } }, void>({
    mutationFn: () => subscriptionApi.activateTrial(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      setTrialError(null);
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      setTrialError(
        typeof detail === 'string'
          ? detail
          : 'Не удалось активировать пробный период. Попробуйте ещё раз.',
      );
    },
  });

  const isLoading = multiSubLoading || (!isMultiTariff && subLoading);

  const liteState: 'inactive' | 'active' | 'expiring' | 'loading' = isLoading
    ? 'loading'
    : !subscription
      ? 'inactive'
      : subscription.isExpired
        ? 'inactive'
        : subscription.daysLeft <= 3
          ? 'expiring'
          : 'active';

  const { data: purchaseOptions } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: () => subscriptionApi.getPurchaseOptions(),
    enabled: liteState === 'inactive',
    staleTime: 60_000,
  });

  const minMonthlyKopeks = useMemo(() => {
    if (!purchaseOptions || purchaseOptions.sales_mode !== 'tariffs') return null;
    const prices = purchaseOptions.tariffs
      .filter((t) => !t.is_daily)
      .flatMap((t) => t.periods.map((p) => p.price_per_month_kopeks))
      .filter((v) => v > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  }, [purchaseOptions]);

  const minMonthlyRubles = minMonthlyKopeks ? Math.round(minMonthlyKopeks / 100) : null;

  const onSelectTariff = () => navigate('/lite/tariffs');
  const onTrial = () => activateTrial.mutate();
  const onConnect = () => navigate('/lite/connect');
  const onRenew = () => {
    if (subscription?.isTrial) {
      navigate('/lite/tariffs');
    } else {
      navigate('/lite/renew');
    }
  };
  const onTariffChange = () => navigate('/lite/tariffs');
  const onDevices = () => navigate('/lite/devices');

  return (
    <LiteLayout variant="home">
      {liteState === 'loading' && (
        <div className="flex flex-col gap-3 pb-2 pt-1.5">
          <div className="h-64 animate-pulse rounded-3xl border border-subo-hairline bg-subo-surface" />
          <div className="h-[70px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface" />
          <div className="h-[70px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface" />
          <div className="h-[70px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface" />
        </div>
      )}

      {liteState === 'inactive' && (
        <div className="py-6">
          <HeroCardInactive
            onSelectTariff={onSelectTariff}
            onTrial={onTrial}
            trialAvailable={trialInfo?.is_available ?? false}
            trialPending={activateTrial.isPending}
            fromPrice={minMonthlyRubles ?? undefined}
          />
          {trialError && (
            <div className="mt-3 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
              {trialError}
            </div>
          )}
        </div>
      )}

      {liteState === 'active' && subscription && (
        <div className="flex flex-col gap-3 pb-2 pt-1.5">
          <HeroCardActive
            daysLeft={subscription.daysLeft}
            endDate={formatRussianDate(subscription.endDate)}
            onConnect={onConnect}
            onRenew={onRenew}
            isTrial={subscription.isTrial}
          />
          <TrafficCard usedGb={subscription.trafficUsedGb} totalGb={subscription.trafficLimitGb} />
          <button
            type="button"
            onClick={onDevices}
            className="block w-full cursor-pointer border-none bg-transparent p-0 text-left"
          >
            <DeviceMini used={devicesData?.total ?? 0} total={subscription.deviceLimit} />
          </button>
          <TariffCard
            name={subscription.tariffName}
            period={calcPeriod(subscription.startDate, subscription.endDate)}
            onChange={onTariffChange}
          />
        </div>
      )}

      {liteState === 'expiring' && subscription && (
        <div className="flex flex-col gap-3 pb-2 pt-1.5">
          <HeroCardExpiring
            daysLeft={subscription.daysLeft}
            endDate={formatRussianDate(subscription.endDate)}
            onConnect={onConnect}
            onRenew={onRenew}
            isTrial={subscription.isTrial}
          />
          <TrafficCard usedGb={subscription.trafficUsedGb} totalGb={subscription.trafficLimitGb} />
          <button
            type="button"
            onClick={onDevices}
            className="block w-full cursor-pointer border-none bg-transparent p-0 text-left"
          >
            <DeviceMini used={devicesData?.total ?? 0} total={subscription.deviceLimit} />
          </button>
          <TariffCard
            name={subscription.tariffName}
            period={calcPeriod(subscription.startDate, subscription.endDate)}
            onChange={onTariffChange}
          />
        </div>
      )}
    </LiteLayout>
  );
}
