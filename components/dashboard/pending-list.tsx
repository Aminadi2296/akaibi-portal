'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { FileTypeIcon } from './file-preview';
import type { DocumentRow } from '@/lib/field-schemas';
import { Trash2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export function PendingList({
  projectId,
  refreshKey,
  canIndex,
  onIndexClick,
}: {
  projectId: string;
  refreshKey: number;
  canIndex: boolean;
  onIndexClick: (doc: DocumentRow) => void;
}) {
  const [pending, setPending] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const res = await fetch(
      `/api/projects/${projectId}/documents?page=1&pageSize=1`,
    );
    const data = await res.json();
    if (data.success) {
      setPending(data.pending);
    }
    setLoading(false);
  }, [projectId]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/documents/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    load();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pendientes de indexación</CardTitle>
          <CardDescription>
            Cualquier empleado puede tomar uno y indexarlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay documentos pendientes por indexar.
            </p>
          ) : (
            <ul className="space-y-2">
              {pending.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileTypeIcon filename={doc.s3_key} />
                    <span
                      className="max-w-[280px] truncate text-sm"
                      title={doc.s3_key ?? ''}
                    >
                      {doc.s3_key}
                    </span>
                  </div>
                  {canIndex && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onIndexClick(doc)}
                      >
                        Indexar documento
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTarget(doc)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Seguro que deseas borrar &quot;{deleteTarget?.s3_key}&quot;?. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonVariants({ variant: 'outline' })}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={confirmDelete}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
