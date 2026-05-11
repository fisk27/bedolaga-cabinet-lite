import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { DeviceIcon } from '@/components/lite/icons';
import { cn } from '@/lib/utils';
import { subscriptionApi } from '@/api/subscription';

function TrashIcon() {
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
    staleTime: 60_000,
  });
  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  const { data: subResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.getSubscription(),
    enabled: !isMultiTariff,
    retry: false,
    staleTime: 60_000,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', subscriptionId] });
      setConfirmingHwid(null);
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
        <div className="font-subo text-[13px] text-subo-textSoft">
          {limit === 0 ? `${total} устройств` : `${total} из ${limit}`}
        </div>
        <div className="flex flex-col gap-2">
          {devices.map((device) => {
            const isConfirming = confirmingHwid === device.hwid;
            const isMutating = deleteMutation.isPending && isConfirming;
            return (
              <div key={device.hwid}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border bg-subo-surface p-4',
                    isConfirming ? 'border-error-500/40' : 'border-subo-hairline',
                  )}
                >
                  <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-subo-surface2 text-subo-text">
                    <DeviceIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-subo text-[16px] font-semibold text-subo-text">
                      {device.device_model || 'Устройство'}
                    </div>
                    <div className="mt-0.5 truncate font-subo text-[13px] text-subo-textSoft">
                      {device.platform} · {device.hwid.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  {!isConfirming ? (
                    <button
                      type="button"
                      onClick={() => onTrashClick(device.hwid)}
                      aria-label="Удалить устройство"
                      className="flex h-[38px] w-[38px] flex-none cursor-pointer items-center justify-center rounded-[10px] border border-subo-hairline bg-transparent p-0 text-subo-textSoft transition-colors hover:bg-subo-hairline"
                    >
                      <TrashIcon />
                    </button>
                  ) : (
                    <div className="flex flex-none items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onConfirmDelete(device.hwid)}
                        disabled={isMutating}
                        className="cursor-pointer rounded-[10px] border-none bg-error-500/90 px-3 py-2 font-subo text-[13px] font-semibold text-white transition-colors hover:bg-error-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isMutating ? 'Удаляем…' : 'Удалить'}
                      </button>
                      <button
                        type="button"
                        onClick={onCancel}
                        disabled={isMutating}
                        className="cursor-pointer rounded-[10px] border border-subo-hairline bg-transparent px-3 py-2 font-subo text-[13px] font-medium text-subo-textSoft transition-colors hover:bg-subo-hairline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
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
