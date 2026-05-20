import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/api/referral';
import { copyToClipboard } from '@/utils/clipboard';
import { useHaptic } from '@/platform';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';

const glassCard =
  'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-[8px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ShareIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4m0 0L8 6m4-4v14"
    />
  </svg>
);

export default function LiteReferral() {
  const haptic = useHaptic();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
  });

  const referralLink = data?.bot_referral_link ?? '';
  const totalReferrals = data?.total_referrals ?? 0;

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await copyToClipboard(referralLink);
      haptic.notification('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      haptic.notification('error');
    }
  };

  const handleShare = () => {
    if (!referralLink) return;
    haptic.impact('light');

    if (navigator.share) {
      navigator.share({ url: referralLink }).catch(() => {});
      return;
    }

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <LiteLayout variant={{ title: 'Пригласи друга' }}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-subo-canary border-t-transparent" />
        </div>
      </LiteLayout>
    );
  }

  if (error || !data) {
    return (
      <LiteLayout variant={{ title: 'Пригласи друга' }}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-500/10">
            <span className="text-3xl">😔</span>
          </div>
          <p className="font-subo text-[15px] text-subo-textMute">
            Не удалось загрузить реферальную информацию
          </p>
        </div>
      </LiteLayout>
    );
  }

  return (
    <LiteLayout variant={{ title: 'Пригласи друга' }}>
      <div className="flex flex-col gap-3 pb-4 pt-1.5">
        {/* Link card */}
        <div
          className={`${glassCard} relative overflow-hidden p-5`}
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(255,215,0,0.10), transparent 60%), rgba(255,255,255,0.025)',
          }}
        >
          <div className="mb-3 text-center">
            <div className="mb-1 font-subo text-[11px] uppercase tracking-[0.06em] text-subo-canary">
              Твоя реферальная ссылка
            </div>
            <div className="font-subo text-[13px] text-subo-textMute">Нажми, чтобы скопировать</div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!referralLink}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-subo-canary/[0.25] bg-subo-canary/[0.08] px-3.5 py-3 text-left transition-colors hover:bg-subo-canary/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[13px] text-subo-text">{referralLink || '—'}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-subo-canary/[0.30] bg-subo-canary/[0.10] text-subo-canary">
              {copied ? <CheckIcon /> : <CopyIcon />}
            </div>
          </button>

          {copied && (
            <p className="mt-2 text-center font-subo text-[12px] text-subo-canary">Скопировано</p>
          )}

          <div className="mt-4">
            <PrimaryButton onClick={handleShare} disabled={!referralLink}>
              <span className="inline-flex items-center gap-2">
                <ShareIcon />
                Поделиться
              </span>
            </PrimaryButton>
          </div>
        </div>

        {/* Stats card */}
        <div className={`${glassCard} px-4 py-3.5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
              <span className="text-subo-canary">👥</span>
              <span>Приглашено друзей</span>
            </div>
            <div className="rounded-full border border-subo-canary/[0.28] bg-subo-canary/[0.10] px-3 py-1 font-subo text-[14px] font-semibold tabular-nums text-subo-canaryHi">
              {totalReferrals}
            </div>
          </div>
        </div>
      </div>
    </LiteLayout>
  );
}
