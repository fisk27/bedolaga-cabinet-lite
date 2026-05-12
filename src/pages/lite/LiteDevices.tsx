import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { DeviceIcon } from '@/components/lite/icons';
import { cn } from '@/lib/utils';
import { subscriptionApi } from '@/api/subscription';
import { API } from '@/config/constants';

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

export default function LiteDevices() {
  const queryClient = useQueryClient();
  const [confirmingHwid, setConfirmingHwid] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices', subscriptionId],
    queryFn: () => subscriptionApi.getDevices(subscriptionId ?? undefined),
    enabled: !!subscriptionId,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (hwid: string) => subscriptionApi.deleteDevice(hwid, subscriptionId ?? undefined),
    onSuccess: (_data, hwid) => {
      queryClient.invalidateQueries({ queryKey: ['devices', subscriptionId] });
      setConfirmingHwid((current) => (current === hwid ? null : current));
      setDeleteError(null);
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
        ?.detail;
      setDeleteError(typeof detail === 'string' ? detail : 'Не удалось удалить устройство');
    },
  });

  const onTrashClick = (hwid: string) => {
    setDeleteError(null);
    setConfirmingHwid(hwid);
  };
  const onCancel = () => {
    setDeleteError(null);
    setConfirmingHwid(null);
  };
  const onConfirmDelete = (hwid: string) => {
    setDeleteError(null);
    deleteMutation.mutate(hwid);
  };

  const devices = devicesData?.devices ?? [];
  const total = devicesData?.total ?? 0;
  const limit = devicesData?.device_limit ?? 0;
  const isLoading = subLoading || (!!subscriptionId && devicesLoading);

  const renderBody = () => {
    if (!subscriptionId && !subLoading) {
      return (
        <p className="py-10 text-center font-subo text-[14px] text-subo-textSoft">
          Нет активной подписки
        </p>
      );
    }
    if (isLoading) {
      return (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[70px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface"
            />
          ))}
        </div>
      );
    }
    if (devices.length === 0) {
      return (
        <p className="py-10 text-center font-subo text-[14px] text-subo-textMute">
          У вас пока нет подключённых устройств
        </p>
      );
    }
    return (
      <>
        <div className="flex items-center gap-3 px-1 pb-3">
          <span className="h-px flex-1 bg-subo-hairline" />
          <span className="whitespace-nowrap font-subo text-[11px] font-semibold uppercase tracking-[0.12em] text-subo-textSoft">
            АКТИВНЫЕ · {total} ИЗ {limit === 0 ? '∞' : limit}
          </span>
          <span className="h-px flex-1 bg-subo-hairline" />
        </div>
        <div className="flex flex-col gap-2">
          {devices.map((device) => {
            const isConfirming = confirmingHwid === device.hwid;
            const isMutating = deleteMutation.isPending && isConfirming;
            return (
              <div key={device.hwid}>
                <div
                  className={cn(
                    'relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.20)] backdrop-blur-[8px]',
                    isConfirming ? 'border-error-500/40' : 'border-subo-canary/[0.08]',
                  )}
                  style={{
                    background:
                      'radial-gradient(120% 80% at 50% 120%, rgba(255,215,0,0.10), transparent 65%), rgba(255,255,255,0.025)',
                  }}
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center text-subo-canary">
                    <DeviceIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-mono text-[14px] font-semibold text-subo-text">
                        {device.device_model || 'Устройство'}
                      </div>
                      {isConfirming ? (
                        <div className="flex flex-none gap-1.5">
                          <button
                            type="button"
                            onClick={onCancel}
                            disabled={isMutating}
                            className="cursor-pointer rounded-lg border border-subo-hairline bg-transparent px-2.5 py-1 font-subo text-[12px] text-subo-textSoft disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={() => onConfirmDelete(device.hwid)}
                            disabled={isMutating}
                            className="cursor-pointer rounded-lg border border-error-500/40 bg-error-500/20 px-2.5 py-1 font-subo text-[12px] font-semibold text-error-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMutating ? 'Удаляем…' : 'Удалить'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onTrashClick(device.hwid)}
                          aria-label="Удалить устройство"
                          className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-lg border border-subo-hairline bg-transparent p-0 text-subo-textSoft transition-colors hover:bg-subo-hairline"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-subo-canary/[0.20] bg-subo-canary/[0.10] px-2 py-0.5 font-subo text-[11px] font-semibold text-subo-canaryHi">
                        {device.platform}
                      </span>
                      <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-subo-textMute">
                        {device.hwid.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                {isConfirming && deleteError && (
                  <div className="mt-2 rounded-xl border border-error-500/30 bg-error-500/10 px-3 py-2 font-subo text-[12px] text-error-400">
                    {deleteError}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <LiteLayout variant={{ title: 'Устройства' }} backFallback="/lite">
      <div className="flex flex-col gap-3 pb-6 pt-3">{renderBody()}</div>
    </LiteLayout>
  );
}
