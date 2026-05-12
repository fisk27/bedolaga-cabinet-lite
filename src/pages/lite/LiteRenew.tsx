import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { RenewOption } from '@/components/lite/RenewOption';
import { subscriptionApi } from '@/api/subscription';
import { balanceApi } from '@/api/balance';
import { API } from '@/config/constants';

export default function LiteRenew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: multiSubData } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  const { data: subResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    enabled: !isMultiTariff,
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const fullSub = subResponse?.subscription ?? null;
  const multiFirst = multiSubData?.subscriptions?.[0] ?? null;
  const subscriptionId = fullSub?.id ?? multiFirst?.id ?? null;
  const tariffName = fullSub?.tariff_name ?? multiFirst?.tariff_name ?? null;

  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['renewal-options', subscriptionId],
    queryFn: () => subscriptionApi.getRenewalOptions(subscriptionId ?? undefined),
    enabled: !!subscriptionId,
    staleTime: 30_000,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 60_000,
  });

  const balanceKopeks = balanceData?.balance_kopeks ?? 0;

  const navigateToTopUp = (missingKopeks: number) => {
    const missingRubles = Math.ceil(missingKopeks / 100);
    const params = new URLSearchParams({
      amount: String(missingRubles),
      returnTo: '/lite/renew',
    });
    navigate(`/lite/balance/top-up?${params.toString()}`);
  };

  const renewMutation = useMutation<
    { message: string; new_end_date: string; amount_paid_kopeks: number },
    {
      response?: {
        data?: {
          detail?: string | { code?: string; missing_amount?: number };
        };
      };
    },
    void
  >({
    mutationFn: () =>
      subscriptionApi.renewSubscription(selectedPeriod!, subscriptionId ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['renewal-options', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      navigate('/lite', { replace: true });
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      if (
        typeof detail === 'object' &&
        detail?.code === 'insufficient_funds' &&
        detail.missing_amount
      ) {
        navigateToTopUp(detail.missing_amount);
      } else {
        setError(typeof detail === 'string' ? detail : 'Не удалось продлить подписку');
      }
    },
  });

  useEffect(() => {
    setError(null);
  }, [selectedPeriod]);

  const selectedOption = options?.find((o) => o.period_days === selectedPeriod) ?? null;
  const canAfford = selectedOption ? balanceKopeks >= selectedOption.price_kopeks : false;
  const needsTopUp = !!selectedOption && !canAfford;

  const ctaLabel = renewMutation.isPending
    ? 'Продлеваем...'
    : needsTopUp
      ? 'Пополнить и продлить'
      : 'Перейти к оплате';

  const ctaDisabled = !selectedOption || renewMutation.isPending;

  const onCtaClick = () => {
    if (!selectedOption) return;
    if (needsTopUp) {
      navigateToTopUp(selectedOption.price_kopeks - balanceKopeks);
    } else {
      renewMutation.mutate();
    }
  };

  const renderBody = () => {
    if (!subscriptionId && !subLoading) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="font-subo text-[14px] text-subo-textSoft">У вас нет активной подписки</p>
          <PrimaryButton onClick={() => navigate('/lite/tariffs')}>Выбрать тариф</PrimaryButton>
        </div>
      );
    }

    if (optionsLoading || subLoading) {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[78px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface"
            />
          ))}
        </div>
      );
    }

    if (!options || options.length === 0) {
      return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <h2 className="font-subo text-[18px] font-semibold tracking-[-0.01em] text-subo-text">
            Нет вариантов продления
          </h2>
          <p className="mt-2 font-subo text-[14px] leading-[1.45] text-subo-textSoft">
            Для этого тарифа продление недоступно. Выберите новый тариф, чтобы продолжить
            пользоваться SUBO VPN.
          </p>
          <div className="mt-6 w-full">
            <PrimaryButton onClick={() => navigate('/lite/tariffs')}>Выбрать тариф</PrimaryButton>
          </div>
        </div>
      );
    }

    return (
      <>
        {tariffName && (
          <div className="rounded-xl border border-subo-hairline bg-subo-surface px-4 py-3">
            <div className="font-subo text-[12px] text-subo-textMute">Текущий тариф</div>
            <div className="mt-0.5 font-subo text-[14px] font-medium text-subo-text">
              {tariffName}
            </div>
          </div>
        )}

        <p className="pt-1 text-center font-subo text-[13px] text-subo-textSoft">
          Выберите период продления
        </p>

        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <RenewOption
              key={option.period_days}
              option={option}
              selected={selectedPeriod === option.period_days}
              canAfford={balanceKopeks >= option.price_kopeks}
              balanceKopeks={balanceKopeks}
              onSelect={() => setSelectedPeriod(option.period_days)}
            />
          ))}
        </div>

        <div className="pt-3">
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
  };

  return (
    <LiteLayout variant={{ title: 'Продление' }}>
      <div className="flex flex-col gap-3 pb-6 pt-1.5">{renderBody()}</div>
    </LiteLayout>
  );
}
