import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { wheelApi, type SpinResult, type SpinHistoryItem } from '@/api/wheel';
import LiteFortuneWheel from '@/components/lite/LiteFortuneWheel';
import { useHaptic } from '@/platform';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';

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

const glassCard =
  'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-[8px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

export default function LiteWheel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const haptic = useHaptic();

  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

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

  const spinMutation = useMutation({
    mutationFn: () => wheelApi.spin('tickets'),
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

  const ticketsBalance = config?.spin_tickets_balance ?? 0;
  const ticketsCost = config?.spin_cost_tickets ?? 1;
  const hasEnoughTickets = ticketsBalance >= ticketsCost;
  const dailyLimitReached = !!(
    config &&
    config.daily_limit > 0 &&
    config.user_spins_today >= config.daily_limit
  );

  const spinDisabled = isSpinning || !hasEnoughTickets || dailyLimitReached || !config?.can_spin;

  const handleSpin = () => {
    if (spinDisabled || !config) return;
    setIsSpinning(true);
    spinMutation.mutate();
  };

  const handleSpinComplete = useCallback(() => {
    setIsSpinning(false);

    if (spinResult) {
      if (spinResult.success && spinResult.prize_type !== 'nothing') {
        haptic.notification('success');
      } else {
        haptic.notification('warning');
      }
    }

    queryClient.invalidateQueries({ queryKey: ['wheel-config'] });
    queryClient.invalidateQueries({ queryKey: ['wheel-history'] });
  }, [queryClient, haptic, spinResult]);

  const closeResultModal = () => {
    setSpinResult(null);
    setTargetRotation(null);
  };

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

  // Optimistic post-spin balance so the chip updates immediately on click,
  // before the next config refetch lands.
  const displayedBalance = isSpinning ? Math.max(0, ticketsBalance - ticketsCost) : ticketsBalance;

  return (
    <LiteLayout variant={{ title: t('wheel.title') }}>
      <div className="flex flex-col gap-3 pb-4 pt-1.5">
        {/* Tickets balance + cost */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5',
              'border-subo-canary/[0.28] bg-subo-canary/[0.10]',
              'font-subo text-[14px] font-medium tracking-[-0.005em] text-subo-canary',
              'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
            ].join(' ')}
          >
            <span className="text-base leading-none">🎟</span>
            <span className="text-subo-textMute">Билеты:</span>
            <span className="font-semibold text-subo-canaryHi [font-feature-settings:'tnum'_1]">
              {displayedBalance}
            </span>
          </div>
          <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-subo text-[12px] text-subo-textMute">
            {ticketsCost} за вращение
          </div>
        </div>

        {/* Daily limit pill */}
        {config.daily_limit > 0 && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 font-subo text-[12px] text-subo-textMute">
              <span>{t('wheel.spinsRemaining')}:</span>
              <span className="font-semibold text-subo-text">
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

          <div className="mt-6">
            <PrimaryButton onClick={handleSpin} disabled={spinDisabled}>
              {isSpinning ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-subo-canaryInk/40 border-t-subo-canaryInk" />
                  {t('wheel.spinning')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span>🎟</span>
                  {t('wheel.spin')}
                </span>
              )}
            </PrimaryButton>
          </div>

          {/* Hints */}
          {!isSpinning && !hasEnoughTickets && (
            <div className="mt-3 rounded-2xl border border-subo-amber/[0.22] bg-subo-amber/[0.08] p-3.5 text-center">
              <p className="font-subo text-[13px] text-subo-amber">
                Купите или продлите подписку чтобы получить билеты
              </p>
            </div>
          )}
          {!isSpinning && hasEnoughTickets && dailyLimitReached && (
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-center">
              <p className="font-subo text-[13px] text-subo-textMute">
                {t('wheel.errors.dailyLimitReached')}
              </p>
            </div>
          )}
          {!isSpinning && hasEnoughTickets && !dailyLimitReached && !config.can_spin && (
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-center">
              <p className="font-subo text-[13px] text-subo-textMute">
                {t('wheel.errors.cannotSpin')}
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

        {/* Main prizes (always visible) */}
        {(() => {
          const mainPrizes = config.prizes.filter((p) => (p.monthly_limit ?? 0) > 0);
          if (mainPrizes.length === 0) return null;
          return (
            <div className={`${glassCard} px-4 py-3.5`}>
              <div className="mb-2.5 inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
                <span className="text-subo-canary">🏆</span>
                <span>Главные призы</span>
              </div>
              <div className="space-y-1.5">
                {mainPrizes.map((prize) => {
                  const winner = prize.current_month_winner;
                  const available = prize.is_available === true;
                  let statusClass: string;
                  let statusText: string;
                  if (winner) {
                    statusClass =
                      'border-success-500/[0.30] bg-success-500/[0.10] text-success-400';
                    statusText = `Выиграл(а) ${winner} ✅`;
                  } else if (available) {
                    statusClass =
                      'border-subo-canary/[0.28] bg-subo-canary/[0.10] text-subo-canary';
                    statusText = 'Ещё не разыгран 🔥';
                  } else {
                    statusClass = 'border-white/[0.06] bg-white/[0.02] text-subo-textMute';
                    statusText = 'Скоро...';
                  }
                  return (
                    <div
                      key={prize.id}
                      className="flex items-center justify-between gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center text-lg">
                          {prize.emoji}
                        </div>
                        <div className="truncate font-subo text-[13px] font-medium text-subo-text">
                          {prize.display_name}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-subo text-[11px] font-medium ${statusClass}`}
                      >
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 font-subo text-[11px] leading-snug text-subo-textMute">
                При выигрыше главного приза вам будет выдан промокод. Обратитесь в поддержку для
                получения приза.
              </p>
            </div>
          );
        })()}

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
                        -{item.payment_amount} 🎟
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

        {/* Rules (collapsible) */}
        <div className={glassCard}>
          <button
            type="button"
            onClick={() => setRulesExpanded((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border-none bg-transparent px-4 py-3.5 text-left"
          >
            <span className="inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
              <span className="text-subo-canary">📋</span>
              Правила
            </span>
            <span className="text-subo-textMute">
              <ChevronIcon expanded={rulesExpanded} />
            </span>
          </button>

          {rulesExpanded && (
            <div className="border-t border-white/[0.06] px-4 pb-3 pt-1.5">
              {[
                '🎟 Билеты начисляются при покупке или продлении подписки (1 билет за каждые 30 дней)',
                '🎡 Каждое вращение стоит 1 билет',
                '🏆 Главные призы (iPhone, AirPods, PlayStation) разыгрываются по 1 штуке в месяц среди всех участников',
                '🎁 При выигрыше главного приза выдаётся промокод — обратитесь в поддержку @subovpn_support для получения',
                '⏰ Между вращениями минимальная пауза 3 секунды',
              ].map((rule) => (
                <div
                  key={rule}
                  className="py-1.5 font-subo text-[13px] leading-snug text-subo-textMute"
                >
                  {rule}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LiteLayout>
  );
}
