import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { balanceApi } from '@/api/balance';
import { useCloseOnSuccessNotification } from '@/store/successNotification';
import type { PaymentMethodOption } from '@/types';

const QUICK_AMOUNTS = [100, 300, 500, 1000, 2000];

function getPreferredOptionId(options: PaymentMethodOption[] | null | undefined): string | null {
  if (!options || options.length === 0) return null;
  const sbp = options.find((o) => /sbp|сбп/i.test(o.id) || /sbp|сбп/i.test(o.name));
  return (sbp ?? options[0]).id;
}

// SBP redirects to the bank app, which can't happen inside Telegram's webview —
// must hand off to the system browser via Telegram WebApp.openLink.
function openExternal(url: string) {
  const tg = window.Telegram?.WebApp;
  if (tg && typeof tg.openLink === 'function') {
    tg.openLink(url, { try_instant_view: false });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function LiteBalanceTopUp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialAmount = parseFloat(searchParams.get('amount') || '0');
  const returnTo = searchParams.get('returnTo');

  const [amountRubles, setAmountRubles] = useState<number>(
    initialAmount > 0 ? Math.ceil(initialAmount) : 100,
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: methods, isLoading: methodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: balanceApi.getPaymentMethods,
    staleTime: 60_000,
  });

  const availableMethods = useMemo(() => methods?.filter((m) => m.is_available) ?? [], [methods]);

  useEffect(() => {
    if (!selectedMethodId && availableMethods.length > 0) {
      const first = availableMethods[0];
      setSelectedMethodId(first.id);
      setSelectedOptionId(getPreferredOptionId(first.options));
    }
  }, [availableMethods, selectedMethodId]);

  const selectedMethod = useMemo(
    () => availableMethods.find((m) => m.id === selectedMethodId) ?? null,
    [availableMethods, selectedMethodId],
  );

  const amountKopeks = amountRubles * 100;

  const inRange = selectedMethod
    ? amountKopeks >= selectedMethod.min_amount_kopeks &&
      amountKopeks <= selectedMethod.max_amount_kopeks
    : false;

  const optionValid = !selectedMethod?.options?.length || !!selectedOptionId;

  const canPay = !!selectedMethod && inRange && optionValid && amountRubles > 0;

  const topUpMutation = useMutation<
    Awaited<ReturnType<typeof balanceApi.createTopUp>>,
    { response?: { data?: { detail?: string } } },
    void
  >({
    mutationFn: () =>
      balanceApi.createTopUp(amountKopeks, selectedMethodId!, selectedOptionId ?? undefined),
    onSuccess: (result) => {
      if (result.payment_url) {
        openExternal(result.payment_url);
      }
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось создать платёж');
    },
  });

  useEffect(() => {
    setError(null);
  }, [amountRubles, selectedMethodId, selectedOptionId]);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    navigate(returnTo || '/lite/balance', { replace: true });
  }, [navigate, queryClient, returnTo]);

  useCloseOnSuccessNotification(handleSuccess);

  const onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAmountRubles(v === '' ? 0 : parseInt(v, 10));
  };

  const ctaLabel = topUpMutation.isPending ? 'Создаём платёж...' : 'Оплатить';
  const ctaDisabled = !canPay || topUpMutation.isPending;

  return (
    <LiteLayout variant={{ title: 'Пополнение' }} backFallback="/lite/balance">
      <div className="flex flex-col gap-4 pb-6 pt-3">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-subo-hairline bg-subo-surface p-5 text-center">
            <div className="flex items-baseline justify-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={amountRubles === 0 ? '' : String(amountRubles)}
                onChange={onAmountChange}
                placeholder="0"
                className="w-[180px] border-none bg-transparent p-0 text-center font-subo text-[36px] font-bold leading-none text-subo-amber outline-none placeholder:text-subo-amber/40"
              />
              <span className="font-subo text-[24px] font-medium text-subo-textSoft">₽</span>
            </div>
            <div className="mt-2 font-subo text-[13px] text-subo-textSoft">Сумма пополнения</div>
            {selectedMethod && !inRange && (
              <div className="mt-2 font-subo text-[12px] text-subo-textMute">
                {amountKopeks < selectedMethod.min_amount_kopeks
                  ? `Минимум ${(selectedMethod.min_amount_kopeks / 100).toLocaleString('ru-RU')} ₽`
                  : `Максимум ${(selectedMethod.max_amount_kopeks / 100).toLocaleString('ru-RU')} ₽`}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amount) => {
              const isSel = amountRubles === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setAmountRubles(amount)}
                  className={cn(
                    'cursor-pointer rounded-full border px-4 py-2 font-subo text-[14px] font-medium transition-colors',
                    isSel
                      ? 'border-subo-amber bg-subo-amber text-subo-amberInk'
                      : 'border-subo-hairline bg-transparent text-subo-textSoft hover:bg-subo-hairline',
                  )}
                >
                  {amount.toLocaleString('ru-RU')} ₽
                </button>
              );
            })}
          </div>

          {methodsLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface"
                />
              ))}
            </div>
          ) : availableMethods.length === 0 ? (
            <p className="py-6 text-center font-subo text-[14px] text-subo-textSoft">
              Сейчас нет доступных способов оплаты
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {availableMethods.map((method) => {
                const isSelected = selectedMethodId === method.id;
                const hasOptions = (method.options?.length ?? 0) > 0;
                const selectCard = () => {
                  setSelectedMethodId(method.id);
                  setSelectedOptionId(getPreferredOptionId(method.options));
                };
                return (
                  <div
                    key={method.id}
                    role="button"
                    tabIndex={0}
                    onClick={selectCard}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectCard();
                      }
                    }}
                    className={cn(
                      'w-full cursor-pointer rounded-2xl border bg-subo-surface p-4 text-left transition-colors',
                      isSelected
                        ? 'border-subo-amber bg-subo-amber/[0.04]'
                        : 'border-subo-hairline hover:bg-subo-text/[0.02]',
                    )}
                  >
                    <div className="font-subo text-[16px] font-semibold tracking-[-0.01em] text-subo-text">
                      {method.name}
                    </div>
                    {hasOptions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {method.options!.map((opt) => {
                          const optActive = isSelected && selectedOptionId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMethodId(method.id);
                                setSelectedOptionId(opt.id);
                              }}
                              className={cn(
                                'cursor-pointer rounded-full border px-3 py-1.5 font-subo text-[13px] transition-colors',
                                optActive
                                  ? 'border-subo-amber bg-subo-amber text-subo-amberInk'
                                  : 'border-subo-hairline bg-transparent text-subo-textSoft hover:bg-subo-hairline',
                              )}
                            >
                              {opt.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={() => topUpMutation.mutate()} disabled={ctaDisabled}>
            {ctaLabel}
          </PrimaryButton>
          {error && (
            <div className="mt-3 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </LiteLayout>
  );
}
