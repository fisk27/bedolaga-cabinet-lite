import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { balanceApi } from '@/api/balance';
import { formatTxAmount, formatTxDate, formatTxDescription } from '@/utils/formatTransaction';
import type { Transaction } from '@/types';

function TransactionCard({ tx }: { tx: Transaction }) {
  const amountClass = tx.amount_kopeks > 0 ? 'text-subo-green' : 'text-subo-textSoft';
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-subo-hairline bg-subo-surface px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="truncate font-subo text-[14px] font-medium text-subo-text">
          {formatTxDescription(tx)}
        </div>
        <div className="mt-0.5 font-subo text-[12px] text-subo-textMute">
          {formatTxDate(tx.created_at)}
        </div>
      </div>
      <div className={`shrink-0 font-subo text-[15px] font-semibold ${amountClass}`}>
        {formatTxAmount(tx.amount_kopeks, tx.type)}
      </div>
    </div>
  );
}

export default function LiteBalance() {
  const navigate = useNavigate();

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 30_000,
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', 1, 10],
    queryFn: () => balanceApi.getTransactions({ page: 1, per_page: 10 }),
    staleTime: 30_000,
  });

  const balanceRubles = balanceData?.balance_rubles ?? 0;
  const transactions = transactionsData?.items ?? [];

  return (
    <LiteLayout variant={{ title: 'Баланс' }}>
      <div className="flex flex-col gap-5 pb-6 pt-3">
        {balanceLoading ? (
          <div
            className="relative overflow-hidden rounded-3xl border border-subo-canary/[0.08] p-7 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px]"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.10), transparent 65%), rgba(255,255,255,0.025)',
            }}
          >
            <div className="mx-auto h-12 w-40 animate-pulse rounded-lg bg-subo-hairline" />
            <div className="mx-auto mt-2 h-3 w-32 animate-pulse rounded-lg bg-subo-hairline" />
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-3xl border border-subo-canary/[0.08] p-7 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px]"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.10), transparent 65%), rgba(255,255,255,0.025)',
            }}
          >
            <div className="font-subo text-[48px] font-bold leading-none text-subo-amber">
              {balanceRubles.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
            </div>
            <div className="mt-2 font-subo text-[13px] text-subo-textSoft">Текущий баланс</div>
          </div>
        )}

        <PrimaryButton onClick={() => navigate('/lite/balance/top-up')}>Пополнить</PrimaryButton>

        <div>
          <div className="mb-2 font-subo text-[11px] font-semibold uppercase tracking-[0.08em] text-subo-textSoft">
            История
          </div>
          {transactions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {transactions.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center font-subo text-[13px] text-subo-textMute">
              Здесь будет отображаться история ваших операций
            </p>
          )}
        </div>
      </div>
    </LiteLayout>
  );
}
