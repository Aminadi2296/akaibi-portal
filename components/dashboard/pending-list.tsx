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

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onIndexClick(doc)}
                  >
                    Indexar este documento
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
