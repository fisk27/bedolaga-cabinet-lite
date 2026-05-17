import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { API } from '@/config/constants';
import type { TariffsPurchaseOptions } from '@/types';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { TariffOption } from '@/components/lite/TariffOption';
import { PeriodSelector } from '@/components/lite/PeriodSelector';
import { PrimaryButton } from '@/components/lite/PrimaryButton';

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface"
        />
      ))}
    </div>
  );
}

export default function LiteTariffs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-options'],
    queryFn: () => subscriptionApi.getPurchaseOptions(),
    staleTime: 30_000,
  });

  // Identify the user's current subscription so previews and purchases for an
  // active subscriber are treated as a switch/extension, not a fresh purchase.
  const { data: subscriptionsList } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const { data: subscriptionResponse } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    enabled: !(subscriptionsList?.multi_tariff_enabled ?? false),
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const activeSubscription = subscriptionResponse?.subscription ?? null;
  // Multi-tariff: treat the first subscription as the switch context until post-launch per-sub UI lands.
  const multiFirst =
    (subscriptionsList?.multi_tariff_enabled ?? false)
      ? (subscriptionsList?.subscriptions?.[0] ?? null)
      : null;
  const currentSubscriptionId =
    activeSubscription && !activeSubscription.is_expired
      ? activeSubscription.id
      : (multiFirst?.id ?? undefined);
  const currentTariffId = activeSubscription?.tariff_id ?? multiFirst?.tariff_id ?? null;

  // Derived selections — kept at component top so the preview query below
  // can read them without violating the rules of hooks.
  const tariffsData: TariffsPurchaseOptions | null =
    data && data.sales_mode === 'tariffs' ? data : null;
  const isTariffsMode = data?.sales_mode === 'tariffs';
  const visibleTariffs = tariffsData?.tariffs.filter((t) => !t.is_daily) ?? [];
  const selectedTariff = visibleTariffs.find((t) => t.id === selectedTariffId) ?? null;
  const selectedPeriod = selectedTariff?.periods.find((p) => p.days === selectedDays) ?? null;

  const {
    data: preview,
    isFetching: previewLoading,
    isError: previewError,
  } = useQuery({
    queryKey: ['lite-purchase-preview', selectedTariffId, selectedDays, currentSubscriptionId],
    queryFn: () =>
      subscriptionApi.previewPurchase({ period_days: selectedDays! }, currentSubscriptionId),
    enabled: !!selectedTariff && !!selectedDays && !isTariffsMode,
    retry: false,
    staleTime: 30_000,
  });

  const navigateToTopUp = (missingKopeks: number) => {
    const missingRubles = Math.ceil(missingKopeks / 100);
    const params = new URLSearchParams({
      amount: String(missingRubles),
      returnTo: '/lite/tariffs',
    });
    navigate(`/lite/balance/top-up?${params.toString()}`);
  };

  // Two purchase endpoints share { success, message }; onSuccess only reads
  // those, so we narrow TData to the common subset. TError is the structural
  // axios error shape we already pattern-match in onError.
  const purchaseMutation = useMutation<
    { success: boolean; message: string },
    {
      response?: {
        data?: {
          detail?: string | { code?: string; missing_amount?: number };
        };
      };
    },
    void
  >({
    mutationFn: async () => {
      if (!selectedTariff || !selectedDays) {
        throw new Error('No tariff selected');
      }

      if (isTariffsMode && currentSubscriptionId !== undefined) {
        // Selecting the tariff the user is already on = extend/renew it.
        // switchTariff rejects same-tariff ("Already on this tariff"); purchaseTariff is the extend path.
        if (currentTariffId !== null && selectedTariff.id === currentTariffId) {
          return await subscriptionApi.purchaseTariff(selectedTariff.id, selectedDays);
        }

        try {
          return await subscriptionApi.switchTariff(selectedTariff.id, currentSubscriptionId);
        } catch (err) {
          const detail = (err as { response?: { data?: { detail?: string; code?: string } } })
            ?.response?.data;
          const useTariffPurchase =
            detail?.code === 'use_purchase_flow' ||
            detail?.detail?.toLowerCase?.().includes('expired');
          if (useTariffPurchase) {
            return await subscriptionApi.purchaseTariff(selectedTariff.id, selectedDays);
          }
          throw err;
        }
      }

      if (isTariffsMode) {
        return subscriptionApi.purchaseTariff(selectedTariff.id, selectedDays);
      }

      return subscriptionApi.submitPurchase({ period_days: selectedDays }, currentSubscriptionId);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['devices', currentSubscriptionId ?? null] });
        navigate('/lite');
      } else {
        setError(result.message || 'Не удалось оформить подписку');
      }
    },
    onError: (err: {
      response?: {
        data?: {
          detail?: string | { code?: string; missing_amount?: number };
        };
      };
    }) => {
      const detail = err.response?.data?.detail;
      if (
        typeof detail === 'object' &&
        detail?.code === 'insufficient_funds' &&
        detail.missing_amount
      ) {
        navigateToTopUp(detail.missing_amount);
      } else {
        setError(typeof detail === 'string' ? detail : 'Ошибка при покупке');
      }
    },
  });

  // Clear stale error whenever the selection changes.
  useEffect(() => {
    setError(null);
  }, [selectedTariffId, selectedDays]);

  const handleSelectTariff = (id: number) => {
    setSelectedTariffId(id);
    const t = visibleTariffs.find((x) => x.id === id);
    setSelectedDays(t?.periods[0]?.days ?? null);
  };

  // Adaptive CTA — purchase when balance is enough, otherwise route to top-up.
  const needsTopUp = !!preview && !preview.can_purchase && (preview.missing_amount_kopeks ?? 0) > 0;

  const ctaLabel = purchaseMutation.isPending
    ? 'Оформляем...'
    : previewLoading && !preview
      ? 'Подсчитываем...'
      : needsTopUp
        ? 'Пополнить и купить'
        : 'Перейти к оплате';

  const ctaDisabled =
    !selectedTariff || !selectedDays || purchaseMutation.isPending || (previewLoading && !preview);

  const onCtaClick = () => {
    if (needsTopUp) {
      navigateToTopUp(preview!.missing_amount_kopeks);
    } else {
      purchaseMutation.mutate();
    }
  };

  const renderPreview = (): ReactNode => {
    // Errored or skipped (tariffs mode has no live preview): fall back to the
    // period's own labels so the page still communicates a price.
    if (selectedPeriod && (previewError || (isTariffsMode && !preview))) {
      return (
        <div className="text-center">
          <div className="font-subo text-[28px] font-semibold tracking-[-0.02em] text-subo-amber">
            {selectedPeriod.price_label}
          </div>
          <div className="mt-0.5 font-subo text-[13px] text-subo-textMute">
            {selectedPeriod.price_per_month_label} / мес
          </div>
        </div>
      );
    }

    // Loading without prior data: subtle placeholder.
    if (previewLoading && !preview) {
      return (
        <div className="text-center font-subo text-[14px] text-subo-textSoft">Подсчитываем…</div>
      );
    }

    if (!preview) return null;

    if (preview.can_purchase) {
      return (
        <div className="text-center">
          <div className="font-subo text-[28px] font-semibold tracking-[-0.02em] text-subo-amber">
            К оплате: {preview.total_price_label}
          </div>
          <div className="mt-0.5 font-subo text-[13px] text-subo-textSoft">
            В месяц: {preview.per_month_price_label}
          </div>
        </div>
      );
    }

    // Calm amber warning — not red — when balance is short.
    if (preview.missing_amount_kopeks > 0) {
      return (
        <div className="flex flex-col gap-1.5 rounded-2xl border border-subo-amber/30 bg-subo-amber/[0.08] px-4 py-3 text-center">
          <div className="font-subo text-[14px] font-medium text-subo-amber">
            Не хватает {preview.missing_amount_label ?? '—'} на балансе
          </div>
          <div className="font-subo text-[13px] text-subo-textMute">
            К оплате: {preview.total_price_label}
          </div>
        </div>
      );
    }

    if (preview.status_message) {
      return (
        <div className="rounded-2xl border border-subo-amber/30 bg-subo-amber/[0.08] px-4 py-3 text-center font-subo text-[14px] font-medium text-subo-amber">
          {preview.status_message}
        </div>
      );
    }

    return null;
  };

  let body: ReactNode;
  if (isLoading) {
    body = <LoadingSkeleton />;
  } else if (!data) {
    body = (
      <div className="py-12 text-center font-subo text-[14px] text-subo-textSoft">
        Не удалось загрузить тарифы
      </div>
    );
  } else if (data.sales_mode === 'classic') {
    // TODO(C+): build a Lite-native classic flow if SALES_MODE=classic users land here.
    body = (
      <div className="flex flex-col gap-4 py-6">
        <p className="text-center font-subo text-[14px] leading-[1.45] text-subo-textSoft">
          Сейчас доступна только классическая покупка — откройте полный кабинет для подробного
          выбора параметров.
        </p>
        <PrimaryButton onClick={() => navigate('/subscription/purchase')}>
          Открыть кабинет
        </PrimaryButton>
      </div>
    );
  } else if (data.tariffs.length === 0) {
    body = (
      <div className="py-12 text-center font-subo text-[14px] text-subo-textSoft">
        {data.all_tariffs_purchased ? 'Все тарифы уже куплены' : 'Сейчас нет доступных тарифов'}
      </div>
    );
  } else if (visibleTariffs.length === 0) {
    body = (
      <div className="flex flex-col gap-4 py-6">
        <p className="text-center font-subo text-[14px] leading-[1.45] text-subo-textSoft">
          Сейчас нет доступных тарифов для оформления. Откройте полный кабинет для расширенных
          вариантов покупки.
        </p>
        <PrimaryButton onClick={() => navigate('/subscription/purchase')}>
          Открыть кабинет
        </PrimaryButton>
      </div>
    );
  } else {
    body = (
      <>
        <div className="flex items-center gap-3 px-1 pb-3">
          <span className="h-px flex-1 bg-subo-hairline" />
          <span className="whitespace-nowrap font-subo text-[11px] font-semibold uppercase tracking-[0.12em] text-subo-textSoft">
            Выберите тариф
          </span>
          <span className="h-px flex-1 bg-subo-hairline" />
        </div>

        <div className="flex flex-col gap-2">
          {visibleTariffs.map((t) => (
            <TariffOption
              key={t.id}
              tariff={t}
              selected={selectedTariffId === t.id}
              onSelect={() => handleSelectTariff(t.id)}
              isCurrent={
                t.id === data.current_tariff_id ||
                (currentTariffId !== null && t.id === currentTariffId)
              }
            />
          ))}
        </div>

        {selectedTariff && selectedTariff.periods.length > 0 && (
          <div className="flex flex-col gap-3">
            <PeriodSelector
              periods={selectedTariff.periods}
              selectedDays={selectedDays}
              onChange={setSelectedDays}
            />
            {renderPreview()}
          </div>
        )}

        <div className="mt-2">
          <PrimaryButton onClick={onCtaClick} disabled={ctaDisabled}>
            {ctaLabel}
          </PrimaryButton>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <LiteLayout variant={{ title: 'Тарифы' }}>
      <div className="flex flex-col gap-5 pb-2 pt-3">{body}</div>
    </LiteLayout>
  );
}
