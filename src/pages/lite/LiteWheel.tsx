import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { wheelApi, type WheelPrize, type SpinResult, type SpinHistoryItem } from '@/api/wheel';
import LiteFortuneWheel from '@/components/lite/LiteFortuneWheel';
import { usePlatform, useHaptic } from '@/platform';
import { useNotify } from '@/platform/hooks/useNotify';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { GhostButton } from '@/components/lite/GhostButton';

const StarIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

const HistoryIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const LITE_SECTOR_COLORS = [
  '#FFD700',
  '#9CA3AF',
  '#FFE352',
  '#A8A29E',
  '#E6BE00',
  '#78716C',
  '#FFCF40',
  '#525252',
];

function calculateRotationForPrize(prizes: WheelPrize[], result: SpinResult): number {
  let prizeIndex = prizes.findIndex(
    (p) => p.display_name === result.prize_display_name && p.emoji === result.emoji,
  );

  if (prizeIndex === -1) {
    prizeIndex = prizes.findIndex((p) => p.display_name === result.prize_display_name);
  }

  if (prizeIndex === -1) {
    prizeIndex = prizes.findIndex(
      (p) => p.emoji === result.emoji && p.prize_type === result.prize_type,
    );
  }

  if (prizeIndex === -1) {
    return Math.random() * 360;
  }

  const sectorAngle = 360 / prizes.length;
  const baseAngle = prizeIndex * sectorAngle + sectorAngle / 2;
  const offset = (Math.random() - 0.5) * sectorAngle * 0.6;
  return 360 - baseAngle + offset;
}

const glassCard =
  'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-[8px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

function LiteLegend({ prizes }: { prizes: WheelPrize[] }) {
  const getColor = (index: number, baseColor?: string) =>
    baseColor || LITE_SECTOR_COLORS[index % LITE_SECTOR_COLORS.length];

  return (
    <div className="space-y-1.5">
      {prizes.map((prize, index) => {
        const color = getColor(index, prize.color);
        return (
          <div
            key={prize.id}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5"
          >
            <div
              className="h-7 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
            />
            <div className="flex h-7 w-7 shrink-0 items-center justify-center text-lg">
              {prize.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-subo text-[13px] font-medium text-subo-text">
                {prize.display_name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LiteWheel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { openInvoice, capabilities } = usePlatform();
  const haptic = useHaptic();
  const notify = useNotify();

  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [paymentType, setPaymentType] = useState<'telegram_stars' | 'subscription_days'>(
    'telegram_stars',
  );
  const [isPayingStars, setIsPayingStars] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [showStarsConfirm, setShowStarsConfirm] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const paymentTypeInitialized = useRef(false);

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
  });

  const { data: history } = useQuery({
    queryKey: ['wheel-history'],
    queryFn: () => wheelApi.getHistory(1, 10),
  });

  useEffect(() => {
    if (!config || paymentTypeInitialized.current) return;
    paymentTypeInitialized.current = true;

    const starsEnabled = config.spin_cost_stars_enabled && config.spin_cost_stars;
    const daysEnabled = config.spin_cost_days_enabled && config.spin_cost_days;

    if (starsEnabled) {
      setPaymentType('telegram_stars');
    } else if (daysEnabled) {
      setPaymentType('subscription_days');
    }

    if (config.eligible_subscriptions?.length === 1) {
      setSelectedSubscriptionId(config.eligible_subscriptions[0].id);
    }
  }, [config]);

  const pollForSpinResult = useCallback(
    async (signal: AbortSignal, maxAttempts = 15, delayMs = 800) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (signal.aborted) return null;

      let historyBefore;
      try {
        historyBefore = await wheelApi.getHistory(1, 1);
      } catch {
        historyBefore = { items: [], total: 0 };
      }
      const lastSpinIdBefore = historyBefore.items.length > 0 ? historyBefore.items[0].id : 0;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (signal.aborted) return null;

        await new Promise((resolve) => setTimeout(resolve, delayMs));

        if (signal.aborted) return null;

        try {
          const historyAfter = await wheelApi.getHistory(1, 1);

          if (historyAfter.items.length > 0) {
            const latestSpin = historyAfter.items[0];
            if (lastSpinIdBefore === 0 || latestSpin.id > lastSpinIdBefore) {
              return {
                success: true,
                prize_id: latestSpin.id,
                prize_type: latestSpin.prize_type,
                prize_value: latestSpin.prize_value,
                prize_display_name: latestSpin.prize_display_name,
                emoji: latestSpin.emoji,
                color: latestSpin.color,
                rotation_degrees: 0,
                message:
                  latestSpin.prize_type === 'nothing'
                    ? t('wheel.noPrize')
                    : `${t('wheel.youWon')} ${latestSpin.prize_display_name}!`,
                promocode: null,
                error: null,
              } as SpinResult;
            }
          }
        } catch {
          // continue polling
        }
      }

      return null;
    },
    [t],
  );

  const pendingStarsResultRef = useRef<SpinResult | null>(null);
  const isStarsSpinRef = useRef(false);
  const pollingAbortRef = useRef<AbortController | null>(null);
  const preOpenedWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    return () => {
      if (pollingAbortRef.current) {
        pollingAbortRef.current.abort();
      }
    };
  }, []);

  const starsInvoiceMutation = useMutation({
    mutationFn: wheelApi.createStarsInvoice,
    onSuccess: async (data) => {
      if (capabilities.hasInvoice) {
        const status = await openInvoice(data.invoice_url);

        if (status === 'paid') {
          isStarsSpinRef.current = true;
          pendingStarsResultRef.current = null;

          if (pollingAbortRef.current) {
            pollingAbortRef.current.abort();
          }
          pollingAbortRef.current = new AbortController();

          const abortSignal = pollingAbortRef.current.signal;
          pollForSpinResult(abortSignal)
            .then((result) => {
              if (abortSignal.aborted) return;

              queryClient.invalidateQueries({ queryKey: ['wheel-config'] });
              queryClient.invalidateQueries({ queryKey: ['wheel-history'] });

              setIsPayingStars(false);

              if (result) {
                pendingStarsResultRef.current = result;
                const rotation = config?.prizes
                  ? calculateRotationForPrize(config.prizes, result)
                  : Math.random() * 360;
                setTargetRotation(rotation);
              } else {
                pendingStarsResultRef.current = {
                  success: true,
                  prize_id: null,
                  prize_type: null,
                  prize_value: 0,
                  prize_display_name: '',
                  emoji: '🎰',
                  color: '#FFD700',
                  rotation_degrees: 0,
                  message: t('wheel.starsPaymentSuccessCheckHistory'),
                  promocode: null,
                  error: null,
                };
                setTargetRotation(Math.random() * 360);
              }

              setIsSpinning(true);
            })
            .catch(() => {
              if (abortSignal.aborted) return;

              setIsPayingStars(false);
              pendingStarsResultRef.current = {
                success: true,
                prize_id: null,
                prize_type: null,
                prize_value: 0,
                prize_display_name: '',
                emoji: '🎰',
                color: '#FFD700',
                rotation_degrees: 0,
                message: t('wheel.starsPaymentSuccessCheckHistory'),
                promocode: null,
                error: null,
              };
              setTargetRotation(Math.random() * 360);
              setIsSpinning(true);
            });
        } else if (status !== 'cancelled') {
          setIsPayingStars(false);
          setSpinResult({
            success: false,
            prize_id: null,
            prize_type: null,
            prize_value: 0,
            prize_display_name: '',
            emoji: '😔',
            color: '#EF4444',
            rotation_degrees: 0,
            message: t('wheel.starsPaymentFailed'),
            promocode: null,
            error: 'payment_failed',
          });
        } else {
          setIsPayingStars(false);
        }
      } else {
        setIsPayingStars(false);
        if (preOpenedWindowRef.current) {
          preOpenedWindowRef.current.location.href = data.invoice_url;
          preOpenedWindowRef.current = null;
        }
        setSpinResult({
          success: true,
          prize_id: null,
          prize_type: null,
          prize_value: 0,
          prize_display_name: '',
          emoji: '⭐',
          color: '#FFD700',
          rotation_degrees: 0,
          message: t('wheel.starsPaymentRedirected'),
          promocode: null,
          error: null,
        });
      }
    },
    onError: () => {
      setIsPayingStars(false);
      if (preOpenedWindowRef.current) {
        preOpenedWindowRef.current.close();
        preOpenedWindowRef.current = null;
      }
      setSpinResult({
        success: false,
        prize_id: null,
        prize_type: null,
        prize_value: 0,
        prize_display_name: '',
        emoji: '😔',
        color: '#EF4444',
        rotation_degrees: 0,
        message: t('wheel.errors.networkError'),
        promocode: null,
        error: 'network_error',
      });
    },
  });

  const handleDirectStarsPay = () => {
    setShowStarsConfirm(false);
    setIsPayingStars(true);
    if (!capabilities.hasInvoice) {
      preOpenedWindowRef.current = window.open('about:blank', '_blank') || null;
    }
    starsInvoiceMutation.mutate();
  };

  const spinMutation = useMutation({
    mutationFn: () => wheelApi.spin(paymentType, selectedSubscriptionId ?? undefined),
    onSuccess: (result) => {
      if (result.success) {
        setTargetRotation(result.rotation_degrees);
        setSpinResult(result);
      } else {
        setIsSpinning(false);
        setSpinResult(result);
      }
    },
    onError: () => {
      setIsSpinning(false);
      setSpinResult({
        success: false,
        message: t('wheel.errors.networkError'),
        error: 'network_error',
        prize_id: null,
        prize_type: null,
        prize_value: 0,
        prize_display_name: '',
        emoji: '',
        color: '',
        rotation_degrees: 0,
        promocode: null,
      });
    },
  });

  const handleSpin = () => {
    if (!config?.can_spin || isSpinning) return;
    setIsSpinning(true);
    spinMutation.mutate();
  };

  const starsEnabled = !!(config?.spin_cost_stars_enabled && config?.spin_cost_stars);
  const daysEnabled = !!(config?.spin_cost_days_enabled && config?.spin_cost_days);
  const bothMethodsAvailable = !!(starsEnabled && daysEnabled);

  const dailyLimitReached = !!(
    config &&
    config.daily_limit > 0 &&
    config.user_spins_today >= config.daily_limit
  );
  const noSubscription = !config?.has_subscription;
  const needsSubscriptionPick =
    paymentType === 'subscription_days' &&
    !!config?.eligible_subscriptions &&
    config.eligible_subscriptions.length > 1 &&
    !selectedSubscriptionId;

  const handleUnifiedSpin = () => {
    if (noSubscription) return;
    if (paymentType === 'telegram_stars') {
      if (!starsEnabled) {
        notify.warning(t('wheel.starsNotAvailable'));
        return;
      }
      setShowStarsConfirm(true);
    } else {
      handleSpin();
    }
  };

  const handleSpinComplete = useCallback(() => {
    setIsSpinning(false);

    if (isStarsSpinRef.current) {
      isStarsSpinRef.current = false;

      if (pendingStarsResultRef.current) {
        setSpinResult(pendingStarsResultRef.current);
        if (pendingStarsResultRef.current.prize_type === 'nothing') {
          haptic.notification('warning');
        } else {
          haptic.notification('success');
        }
        pendingStarsResultRef.current = null;
      } else {
        setSpinResult({
          success: true,
          prize_id: null,
          prize_type: null,
          prize_value: 0,
          prize_display_name: '',
          emoji: '🎰',
          color: '#FFD700',
          rotation_degrees: 0,
          message: t('wheel.starsPaymentSuccessCheckHistory'),
          promocode: null,
          error: null,
        });
        haptic.notification('success');
      }
    } else if (spinResult) {
      if (spinResult.success && spinResult.prize_type !== 'nothing') {
        haptic.notification('success');
      } else {
        haptic.notification('warning');
      }
    }

    queryClient.invalidateQueries({ queryKey: ['wheel-config'] });
    queryClient.invalidateQueries({ queryKey: ['wheel-history'] });
  }, [queryClient, t, haptic, spinResult]);

  const closeResultModal = () => {
    setSpinResult(null);
    setTargetRotation(null);
  };

  const spinDisabled =
    isSpinning ||
    isPayingStars ||
    dailyLimitReached ||
    noSubscription ||
    needsSubscriptionPick ||
    (paymentType === 'telegram_stars' ? !starsEnabled : !config?.can_spin);

  if (isLoading) {
    return (
      <LiteLayout variant={{ title: t('wheel.title') }}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-subo-canary border-t-transparent" />
        </div>
      </LiteLayout>
    );
  }

  if (error || !config) {
    return (
      <LiteLayout variant={{ title: t('wheel.title') }}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-500/10">
            <span className="text-3xl">😔</span>
          </div>
          <p className="font-subo text-[15px] text-subo-textMute">{t('wheel.errors.loadFailed')}</p>
        </div>
      </LiteLayout>
    );
  }

  if (!config.is_enabled) {
    return (
      <LiteLayout variant={{ title: t('wheel.title') }}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03]">
            <span className="text-4xl">🎡</span>
          </div>
          <p className="font-subo text-[15px] text-subo-textMute">{t('wheel.disabled')}</p>
        </div>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout variant={{ title: t('wheel.title') }}>
      <div className="flex flex-col gap-3 pb-4 pt-1.5">
        {/* Spins remaining pill */}
        {config.daily_limit > 0 && (
          <div className="flex justify-center">
            <div
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                'border-subo-canary/[0.20] bg-subo-canary/[0.08]',
                'font-subo text-[13px] font-medium tracking-[-0.005em] text-subo-canary',
              ].join(' ')}
            >
              <span className="text-subo-textMute">{t('wheel.spinsRemaining')}:</span>
              <span className="font-semibold">
                {Math.max(0, config.daily_limit - config.user_spins_today)}/{config.daily_limit}
              </span>
            </div>
          </div>
        )}

        {/* Wheel card */}
        <div
          className={`${glassCard} relative overflow-hidden p-5`}
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(255,215,0,0.10), transparent 60%), rgba(255,255,255,0.025)',
          }}
        >
          <div className="relative">
            <LiteFortuneWheel
              prizes={config.prizes}
              isSpinning={isSpinning}
              targetRotation={targetRotation}
              onSpinComplete={handleSpinComplete}
            />
          </div>

          {/* Payment selector */}
          {(starsEnabled || daysEnabled) && (
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5">
              <p className="mb-1 mt-0.5 text-center font-subo text-[11px] uppercase tracking-[0.06em] text-subo-textMute">
                {t('wheel.spinCost')}
              </p>
              <div className={`grid gap-1 ${bothMethodsAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {starsEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentType('telegram_stars')}
                    disabled={isSpinning}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5',
                      'font-subo text-[13px] font-medium tracking-[-0.005em] transition-all',
                      paymentType === 'telegram_stars'
                        ? 'bg-subo-canary/[0.14] text-subo-canary shadow-[inset_0_0_0_1px_rgba(255,215,0,0.25)]'
                        : 'text-subo-textSoft hover:text-subo-text',
                    ].join(' ')}
                  >
                    <StarIcon />
                    {`${config.spin_cost_stars} ⭐`}
                  </button>
                )}
                {daysEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentType('subscription_days')}
                    disabled={isSpinning}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5',
                      'font-subo text-[13px] font-medium tracking-[-0.005em] transition-all',
                      paymentType === 'subscription_days'
                        ? 'bg-subo-canary/[0.14] text-subo-canary shadow-[inset_0_0_0_1px_rgba(255,215,0,0.25)]'
                        : 'text-subo-textSoft hover:text-subo-text',
                    ].join(' ')}
                  >
                    <CalendarIcon />
                    {t('wheel.days', { count: config.spin_cost_days ?? 0 })}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Multi-subscription picker */}
          {paymentType === 'subscription_days' &&
            config.eligible_subscriptions &&
            config.eligible_subscriptions.length > 1 && (
              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="mb-2 text-center font-subo text-[11px] uppercase tracking-[0.06em] text-subo-textMute">
                  {t('wheel.selectSubscription', 'Выберите подписку')}
                </p>
                <div className="space-y-1.5">
                  {config.eligible_subscriptions.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubscriptionId(sub.id)}
                      disabled={isSpinning}
                      className={[
                        'flex w-full items-center justify-between rounded-xl px-3 py-2 font-subo text-[13px] transition-all',
                        selectedSubscriptionId === sub.id
                          ? 'bg-subo-canary/[0.14] text-subo-canary shadow-[inset_0_0_0_1px_rgba(255,215,0,0.25)]'
                          : 'text-subo-textSoft hover:text-subo-text',
                      ].join(' ')}
                    >
                      <span className="font-medium">
                        {sub.tariff_name || t('subscription.defaultName', 'Подписка')}
                      </span>
                      <span className="text-[12px] opacity-70">
                        {sub.days_left} {t('common.units.days', 'дней')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Stars confirm */}
          {showStarsConfirm && !isSpinning && !isPayingStars ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-subo-canary/[0.20] bg-subo-canary/[0.06] p-3.5">
              <p className="text-center font-subo text-[13px] text-subo-textSoft">
                {t('wheel.confirmStarsPayment')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <GhostButton onClick={() => setShowStarsConfirm(false)}>
                  {t('common.cancel')}
                </GhostButton>
                <PrimaryButton onClick={handleDirectStarsPay}>
                  {t('wheel.payStars', { count: config.spin_cost_stars ?? 0 })}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <PrimaryButton onClick={handleUnifiedSpin} disabled={spinDisabled}>
                {isSpinning || isPayingStars ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-subo-canaryInk/40 border-t-subo-canaryInk" />
                    {isSpinning ? t('wheel.spinning') : t('wheel.processingPayment')}
                  </span>
                ) : (
                  t('wheel.spin')
                )}
              </PrimaryButton>
            </div>
          )}

          {/* Hints */}
          {!isSpinning && noSubscription && (
            <div className="mt-3 rounded-2xl border border-subo-amber/[0.22] bg-subo-amber/[0.08] p-3.5 text-center">
              <p className="font-subo text-[13px] text-subo-amber">
                {t('wheel.errors.noSubscription')}
              </p>
            </div>
          )}
          {!isSpinning &&
            !noSubscription &&
            paymentType !== 'telegram_stars' &&
            !config.can_spin && (
              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-center">
                <p className="font-subo text-[13px] text-subo-textMute">
                  {config.can_spin_reason === 'daily_limit_reached'
                    ? t('wheel.errors.dailyLimitReached')
                    : t('wheel.errors.cannotSpin')}
                </p>
              </div>
            )}
          {!isSpinning &&
            !noSubscription &&
            paymentType === 'telegram_stars' &&
            dailyLimitReached && (
              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-center">
                <p className="font-subo text-[13px] text-subo-textMute">
                  {t('wheel.errors.dailyLimitReached')}
                </p>
              </div>
            )}
          {!isSpinning && needsSubscriptionPick && (
            <div className="mt-3 rounded-2xl border border-subo-amber/[0.22] bg-subo-amber/[0.08] p-3.5 text-center">
              <p className="font-subo text-[13px] text-subo-amber">
                {t('wheel.errors.selectSubscription', 'Выберите подписку для списания дней')}
              </p>
            </div>
          )}

          {/* Inline result */}
          {spinResult && !isSpinning && (
            <div
              className={[
                'mt-3 rounded-2xl border p-3.5',
                spinResult.success
                  ? 'border-subo-canary/[0.25] bg-subo-canary/[0.08]'
                  : 'border-error-500/[0.30] bg-error-500/10',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30 text-2xl">
                  {spinResult.success ? spinResult.emoji || '🎉' : '😔'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-subo text-[15px] font-semibold tracking-[-0.01em] text-subo-text">
                    {spinResult.success && spinResult.prize_display_name
                      ? spinResult.prize_display_name
                      : spinResult.success
                        ? spinResult.prize_type === 'nothing'
                          ? t('wheel.noLuck')
                          : t('wheel.congratulations')
                        : t('wheel.oops')}
                  </div>
                  <div className="mt-0.5 font-subo text-[13px] text-subo-textMute">
                    {spinResult.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeResultModal}
                  className="shrink-0 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-subo-textMute transition-colors hover:bg-white/[0.05] hover:text-subo-text"
                  aria-label={t('wheel.close')}
                >
                  <CloseIcon />
                </button>
              </div>

              {spinResult.promocode && (
                <div className="mt-3 rounded-xl border border-subo-canary/[0.25] bg-subo-canary/[0.10] p-3 text-center">
                  <p className="mb-1 font-subo text-[11px] uppercase tracking-[0.06em] text-subo-canary">
                    {t('wheel.yourPromoCode')}
                  </p>
                  <p className="select-all font-mono text-[18px] font-bold tracking-wider text-white">
                    {spinResult.promocode}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prize legend (collapsible) */}
        <div className={glassCard}>
          <button
            type="button"
            onClick={() => setLegendExpanded((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border-none bg-transparent px-4 py-3.5 text-left"
          >
            <span className="inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
              <span className="text-subo-canary">🏆</span>
              {t('wheel.prizes')}
              <span className="font-subo text-[12px] font-normal text-subo-textMute">
                ({config.prizes.length})
              </span>
            </span>
            <span className="text-subo-textMute">
              <ChevronIcon expanded={legendExpanded} />
            </span>
          </button>
          {legendExpanded && (
            <div className="border-t border-white/[0.06] px-3 pb-3 pt-3">
              <LiteLegend prizes={config.prizes} />
            </div>
          )}
        </div>

        {/* History (collapsible) */}
        <div className={glassCard}>
          <button
            type="button"
            onClick={() => setHistoryExpanded((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border-none bg-transparent px-4 py-3.5 text-left"
          >
            <span className="inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
              <span className="text-subo-canary">
                <HistoryIcon />
              </span>
              {t('wheel.recentSpins')}
              {history && history.items.length > 0 && (
                <span className="font-subo text-[12px] font-normal text-subo-textMute">
                  ({history.items.length})
                </span>
              )}
            </span>
            <span className="text-subo-textMute">
              <ChevronIcon expanded={historyExpanded} />
            </span>
          </button>

          {historyExpanded && (
            <div className="border-t border-white/[0.06] px-3 pb-3 pt-3">
              {history && history.items.length > 0 ? (
                <div className="space-y-1.5">
                  {history.items.map((item: SpinHistoryItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30 text-lg">
                          {item.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-subo text-[13px] font-medium text-subo-text">
                            {item.prize_display_name}
                          </div>
                          <div className="font-subo text-[11px] text-subo-textMute">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="whitespace-nowrap font-subo text-[12px] text-subo-textSoft">
                        -
                        {item.payment_type === 'telegram_stars'
                          ? `${item.payment_amount} ⭐`
                          : `${item.payment_amount}${t('wheel.days').charAt(0)}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center font-subo text-[13px] text-subo-textMute">
                  <div className="mb-2 text-2xl">🎰</div>
                  {t('wheel.noHistory')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </LiteLayout>
  );
}
