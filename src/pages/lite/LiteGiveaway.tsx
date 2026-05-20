import { useQuery } from '@tanstack/react-query';
import { wheelApi } from '@/api/wheel';
import { LiteLayout } from '@/components/lite/LiteLayout';

const glassCard =
  'rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-[8px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]';

const PRIZES = [
  '🥇 1 место — iPhone 17 Pro Max',
  '🥈 2–25 места — 3 000 ₽',
  '🥉 26–35 места — VPN на 1 месяц',
  '🎁 36–50 места — VPN на 2 недели',
];

const HOW_TO = [
  '🎟 Покупаешь или продлеваешь VPN — получаешь тикет (1 тикет за каждые 30 дней подписки)',
  '🎟 Приглашаешь друга — получаешь тикет (друг должен оформить подписку)',
];

export default function LiteGiveaway() {
  const { data: config } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
    staleTime: 60_000,
  });

  const tickets = config?.spin_tickets_balance ?? 0;

  return (
    <LiteLayout variant={{ title: 'Розыгрыш' }}>
      <div className="flex flex-col gap-3 pb-4 pt-1.5">
        {/* Big header */}
        <div className="pb-1 pt-2 text-center">
          <h1 className="font-subo text-[34px] font-bold leading-tight tracking-[-0.02em] text-subo-canary">
            🎉 РОЗЫГРЫШ
          </h1>
        </div>

        {/* Opening banner */}
        <div
          className={`${glassCard} relative overflow-hidden px-4 py-4 text-center`}
          style={{
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(255,215,0,0.12), transparent 60%), rgba(255,255,255,0.025)',
          }}
        >
          <p className="font-subo text-[15px] font-semibold uppercase tracking-[0.04em] text-subo-text">
            В честь открытия SUBO VPN
          </p>
        </div>

        {/* Prizes */}
        <div className={`${glassCard} px-4 py-3.5`}>
          <div className="mb-2.5 inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
            <span className="text-subo-canary">🏆</span>
            <span>Призы</span>
          </div>
          <div className="space-y-1.5">
            {PRIZES.map((prize) => (
              <div
                key={prize}
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 font-subo text-[13px] leading-snug text-subo-text"
              >
                {prize}
              </div>
            ))}
          </div>
          <div className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subo-canary/[0.25] bg-subo-canary/[0.08] px-3 py-2 font-subo text-[13px] font-medium text-subo-canary">
            <span>🗓</span>
            <span>Итоги: 31.05.2026</span>
          </div>
        </div>

        {/* How to get tickets */}
        <div className={`${glassCard} px-4 py-3.5`}>
          <div className="mb-2.5 inline-flex items-center gap-2 font-subo text-[14px] font-semibold text-subo-text">
            <span className="text-subo-canary">⚙️</span>
            <span>Как получить тикеты</span>
          </div>
          <div className="space-y-1.5">
            {HOW_TO.map((rule) => (
              <p key={rule} className="font-subo text-[13px] leading-snug text-subo-textMute">
                {rule}
              </p>
            ))}
          </div>
        </div>

        {/* Canary note */}
        <div className="rounded-2xl border border-subo-canary/[0.28] bg-subo-canary/[0.10] px-4 py-3 text-center font-subo text-[14px] font-semibold text-subo-canary">
          💥 Чем больше тикетов — тем выше шанс!
        </div>

        {/* Current tickets */}
        <div className={`${glassCard} flex items-center justify-between gap-3 px-4 py-3.5`}>
          <span className="font-subo text-[14px] font-medium text-subo-textMute">У тебя:</span>
          <span className="inline-flex items-center gap-1.5 font-subo text-[18px] font-bold tabular-nums text-subo-canaryHi">
            {tickets}
            <span className="text-[16px] leading-none">🎟</span>
          </span>
        </div>
      </div>
    </LiteLayout>
  );
}
