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
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 10;

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);

  // Reset to page 1 whenever the project changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({
      pendingPage: String(page),
      pendingPageSize: String(PAGE_SIZE),
      // Keep the indexed side of the response cheap since this component
      // only needs pending data.
      pageSize: '1',
    });
    const res = await fetch(
      `/api/projects/${projectId}/documents?${params.toString()}`,
    );
    const data = await res.json();
    if (data.success) {
      setPending(data.pending);
      setTotal(data.totalPending ?? data.pending.length);
    }
    setLoading(false);
  }, [projectId, page]);

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
                  <div className="flex items-center gap-3 min-w-0">
                    <FileTypeIcon filename={doc.s3_key} />
                    <div className="flex flex-col min-w-0">
                      <span
                        className="max-w-[280px] truncate text-sm font-medium"
                        title={doc.s3_key ?? ''}
                      >
                        {doc.s3_key}
                      </span>
                      {doc.custom_fields?.relativePath && (
                        <span
                          className="max-w-[280px] truncate text-xs text-muted-foreground"
                          title={doc.custom_fields.relativePath}
                        >
                          Carpeta: {doc.custom_fields.relativePath}
                        </span>
                      )}
                    </div>
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

          {!loading && total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages} · {total} en total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
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
