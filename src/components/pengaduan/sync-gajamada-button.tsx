'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { syncGajamadaIntakeAction } from '@/app/(dashboard)/pengaduan/actions';

export function SyncGajamadaButton({ autoSyncMinutes = 30 }: { autoSyncMinutes?: number }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const doIntake = useCallback(
    async (isAuto: boolean) => {
      setIsPending(true);
      const toastId = isAuto ? toast.loading('Auto-sync Gajamada berjalan...') : null;

      try {
        const res = await syncGajamadaIntakeAction();
        if (res.error) {
          toast.error(`Gagal sync Gajamada: ${res.error}`, { id: toastId ?? undefined });
          return;
        }
        const now = Date.now();
        localStorage.setItem('gajamada_last_sync', now.toString());
        setLastSync(new Date(now).toLocaleTimeString('id-ID'));

        if (res.count && res.count > 0) {
          toast.success(`Sync Gajamada: ${res.count} laporan baru, ${res.skipped} sudah ada`, {
            id: toastId ?? undefined,
          });
        } else {
          toast.info(`Tidak ada laporan baru (${res.skipped} sudah ada)`, {
            id: toastId ?? undefined,
          });
        }
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gagal sync Gajamada', {
          id: toastId ?? undefined,
        });
      } finally {
        setIsPending(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const lastStr = localStorage.getItem('gajamada_last_sync');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lastStr) setLastSync(new Date(parseInt(lastStr, 10)).toLocaleTimeString('id-ID'));
  }, []);

  useEffect(() => {
    const lastStr = localStorage.getItem('gajamada_last_sync');
    if (lastStr) {
      const diff = (Date.now() - parseInt(lastStr, 10)) / 1000 / 60;
      if (diff < autoSyncMinutes) return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void doIntake(true);
  }, [autoSyncMinutes, doIntake]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void doIntake(false)}
      disabled={isPending}
      className="gap-2"
      title={lastSync ? `Sync terakhir: ${lastSync}` : 'Belum pernah sync'}
    >
      <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Syncing...' : 'Sinkron Gajamada'}
    </Button>
  );
}
